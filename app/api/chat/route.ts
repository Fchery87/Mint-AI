import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { getSystemPrompt, type OutputFormat } from '@/lib/prompts';
import { checkRateLimit, getClientIp, formatRetryAfter } from '@/lib/ratelimit';
import { getActiveProvider, type LLMProvider } from '@/lib/providers';
import { trackUsage } from '@/lib/cost-tracking';
import { detectIntent, buildSkillContext } from '@/lib/skills/classifier';
import { SkillType } from '@/types/skill';

// SSE helper: Format event with proper named event syntax for EventSource
function sseEvent(eventType: string, data: Record<string, unknown>): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Lazy initialize OpenAI-compatible client based on active provider
let openaiClient: OpenAI | null = null;
let currentProvider: LLMProvider | null = null;

function getOpenAIClient() {
  const provider = getActiveProvider();

  // Reinitialize if provider changed
  if (!openaiClient || currentProvider?.name !== provider.name) {
    openaiClient = new OpenAI({
      baseURL: provider.baseURL,
      apiKey: provider.apiKey,
      defaultHeaders: provider.headers,
    });
    currentProvider = provider;
  }

  return { client: openaiClient, provider };
}

// Request validation schema
const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 characters)'),
  chatId: z.string().optional(),
  outputFormat: z.string().optional(),
  mode: z.enum(['agent', 'ask']).optional(),
  webSearch: z.boolean().optional(),
  forceSkill: z.string().optional(), // Optional: force a specific skill
});

export interface ChatRequest {
  message: string;
  chatId?: string;
  outputFormat?: OutputFormat;
  mode?: 'agent' | 'ask';
  webSearch?: boolean;
  forceSkill?: string;
}

export interface ChatResponse {
  id: string;
  code: string;
  message: string;
}

async function getWebSearchContext(query: string): Promise<{
  context: string;
  sources: Array<{ title?: string; url: string }>;
} | null> {
  const enabled = process.env.ENABLE_WEB_SEARCH === 'true';
  const apiKey = process.env.EXA_API_KEY;
  if (!enabled || !apiKey) return null;

  const searchRes = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      type: 'neural',
      useAutoprompt: true,
    }),
  });

  if (!searchRes.ok) {
    throw new Error(
      `Web search failed: ${searchRes.status} ${searchRes.statusText}`,
    );
  }

  const data: any = await searchRes.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  const sources = results
    .map((r: any) => ({
      title: typeof r?.title === 'string' ? r.title : undefined,
      url: typeof r?.url === 'string' ? r.url : '',
    }))
    .filter((r: any) => r.url);

  const contextLines = sources.map((s: any, idx: number) => {
    const title = s.title ? s.title.replace(/\s+/g, ' ').trim() : 'Untitled';
    return `[${idx + 1}] ${title} — ${s.url}`;
  });

  return {
    context:
      `Web search results (use as up-to-date references; cite URLs when relevant):\n` +
      contextLines.join('\n'),
    sources,
  };
}

// Simple in-memory chat history storage
const chatHistories = new Map<
  string,
  Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
>();

function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function splitReasoningAtTerminator(buffer: string): {
  reasoningContent: string;
  rest: string;
  terminated: boolean;
} {
  const endTag = '</reasoning>';
  const endTagIdx = buffer.indexOf(endTag);
  const fenceIdx = buffer.indexOf('```');

  // If a fenced code block appears before </reasoning>, treat it as an early terminator.
  // Keep the fence in the remaining buffer so normal code parsing can handle it.
  if (fenceIdx !== -1 && (endTagIdx === -1 || fenceIdx < endTagIdx)) {
    return {
      reasoningContent: buffer.substring(0, fenceIdx),
      rest: buffer.substring(fenceIdx),
      terminated: true,
    };
  }

  if (endTagIdx !== -1) {
    return {
      reasoningContent: buffer.substring(0, endTagIdx),
      rest: buffer.substring(endTagIdx + endTag.length),
      terminated: true,
    };
  }

  return { reasoningContent: '', rest: buffer, terminated: false };
}

export function splitReasoningForStreaming(
  buffer: string,
  minChunkSize = 30,
): { chunk: string; rest: string } {
  const endTag = '</reasoning>';
  const holdback = endTag.length - 1;
  const shouldFlush =
    buffer.includes('\n') || buffer.length >= minChunkSize + holdback;

  if (!shouldFlush || buffer.length <= holdback) {
    return { chunk: '', rest: buffer };
  }

  const safeLen = buffer.length - holdback;
  return { chunk: buffer.slice(0, safeLen), rest: buffer.slice(safeLen) };
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Rate limiting: 10 requests per minute per IP
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, 10, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: formatRetryAfter(rateLimit.resetAt),
        },
        {
          status: 429,
          headers: {
            'Retry-After': formatRetryAfter(rateLimit.resetAt).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        },
      );
    }

    const rawBody = await req.json();

    // Validate request body
    const validationResult = chatRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return NextResponse.json(
        {
          error: 'Invalid request',
          details: errorDetails,
        },
        { status: 400 },
      );
    }

    const { message, chatId } = validationResult.data;
    const outputFormat: OutputFormat =
      validationResult.data.outputFormat || 'React';
    const mode: 'agent' | 'ask' = validationResult.data.mode || 'agent';
    const webSearchRequested: boolean = Boolean(
      validationResult.data.webSearch,
    );
    const forceSkill: string | undefined = validationResult.data.forceSkill;

    // Track request start time for duration calculation
    const requestStartTime = Date.now();

    // Get or create chat history
    const currentChatId = chatId || generateChatId();
    let history = chatHistories.get(currentChatId) || [];

    // Add user message to history
    history.push({
      role: 'user',
      content: message,
    });

    // Detect user intent and determine skill
    const intent = forceSkill
      ? { skillType: forceSkill as SkillType, confidence: 1.0 }
      : detectIntent(message);
    buildSkillContext(message, intent.skillType); // Build context for potential future use

    // Get the active provider and client
    const { client, provider } = getOpenAIClient();

    // Build skill-aware system prompt
    let systemPrompt = getSystemPrompt(outputFormat, { mode });

    // Add skill-specific context to system prompt
    const skillInstructions: Record<SkillType, string> = {
      [SkillType.BRAINSTORM]: `\n\nYou are in BRAINSTORM mode.

IMPORTANT: Think through the request step by step. Output ONE thinking tag at a time for each aspect. Wait for each to be sent before continuing.

Use these thinking tags in order:
1. <thinking type="requirements">What you're understanding about requirements</thinking>
2. <thinking type="considerations">Key considerations and constraints</thinking>
3. <thinking type="approaches">Different approaches being explored</thinking>
4. <thinking type="questions">Clarifying questions if needed</thinking>

Each tag should be sent separately - don't combine multiple thoughts in one tag.`,

      [SkillType.PLAN]: `\n\nYou are in PLAN mode.

IMPORTANT: Break down the implementation step by step. Output ONE thinking tag at a time for each step.

Use these thinking tags in order:
1. <thinking type="understanding">Understanding of the problem</thinking>
2. <thinking type="breakdown">Step-by-step solution breakdown</thinking>
3. <thinking type="dependencies">Dependencies between steps</thinking>
4. <thinking type="challenges">Potential challenges and mitigations</thinking>

Each tag should be sent separately.`,

      [SkillType.CODE]: `\n\nYou are in CODE mode.

IMPORTANT: Before writing code, think through the implementation step by step. Output ONE thinking tag at a time for each aspect.

Use these thinking tags in order:
1. <thinking type="requirements">What you're building - core requirements</thinking>
2. <thinking type="architecture">Architecture and file structure decisions</thinking>
3. <thinking type="components">Key functions/components you'll create</thinking>
4. <thinking type="edgecases">Edge cases you're handling</thinking>

Each tag should be sent separately.`,

      [SkillType.DEBUG]: `\n\nYou are in DEBUG mode.

IMPORTANT: Analyze the issue step by step. Output ONE thinking tag at a time.

Use these thinking tags in order:
1. <thinking type="analysis">Understanding the reported issue</thinking>
2. <thinking type="hypothesis">Where you think the problem lies</thinking>
3. <thinking type="investigation">What you'll check/verify</thinking>
4. <thinking type="solution">Your proposed fix approach</thinking>

Each tag should be sent separately.`,

      [SkillType.REVIEW]: `\n\nYou are in REVIEW mode.

IMPORTANT: Review the code systematically. Output ONE thinking tag at a time.

Use these thinking tags in order:
1. <thinking type="overview">What you're reviewing</thinking>
2. <thinking type="correctness">Code correctness checks</thinking>
3. <thinking type="bestpractices">Best practices verification</thinking>
4. <thinking type="improvements">Suggested improvements</thinking>

Each tag should be sent separately.`,

      [SkillType.SEARCH]: `\n\nYou are in SEARCH mode.

IMPORTANT: Show your search strategy. Output ONE thinking tag at a time.

Use these thinking tags in order:
1. <thinking type="info">What information you need</thinking>
2. <thinking type="approach">How you'll find it</thinking>
3. <thinking type="findings">Key findings from search</thinking>

Each tag should be sent separately.`,

      [SkillType.GENERAL]: `\n\nIMPORTANT: Think step by step. Output ONE thinking tag at a time for each aspect of your response.

Use thinking tags as needed:
<thinking type="understanding">What you're understanding</thinking>
<thinking type="approach">How you'll respond</thinking>

Each tag should be sent separately.`,
    };

    systemPrompt += skillInstructions[intent.skillType] || '';

    let webSearchContext: string | null = null;
    if (webSearchRequested) {
      try {
        const search = await getWebSearchContext(message);
        webSearchContext = search?.context || null;
      } catch (e) {
        Sentry.captureException(e, {
          tags: { source: 'web-search' },
          extra: { provider: provider.name },
        });
      }
    }

    // Call LLM API with streaming (include usage data)
    const stream = await client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(webSearchContext
          ? [{ role: 'system', content: webSearchContext } as const]
          : []),
        ...history,
      ],
      max_tokens: 4096,
      stream: true,
      temperature: 0.2,
      stream_options: {
        include_usage: true,
      },
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    let fullResponse = '';
    let usageData: any = null;
    let accumulatedCode = ''; // Track full code for done event

    // Map skill type to workflow stage
    const skillToStage: Record<SkillType, string> = {
      [SkillType.BRAINSTORM]: 'thinking',
      [SkillType.PLAN]: 'planning',
      [SkillType.CODE]: 'coding',
      [SkillType.DEBUG]: 'coding',
      [SkillType.REVIEW]: 'reviewing',
      [SkillType.SEARCH]: 'thinking',
      [SkillType.GENERAL]: 'idle',
    };

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send skill activation event first (named event for EventSource)
          controller.enqueue(
            encoder.encode(
              sseEvent('skill-activated', {
                skill: {
                  type: intent.skillType,
                  stage: skillToStage[intent.skillType],
                  confidence: intent.confidence,
                },
              }),
            ),
          );

          let buffer = '';
          let inCodeBlock = false;
          let thinkingType: string | null = null;
          let thinkingBuffer = '';
          let explanationBuffer = '';

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';

            // Capture usage data if present (sent in final chunk)
            if (chunk.usage) {
              usageData = chunk.usage;
            }

            if (content) {
              fullResponse += content;
              buffer += content;

              // Process buffer for tags and content
              while (buffer.length > 0) {
                // Check for thinking start tag anywhere in buffer: <thinking type="...">
                const thinkingStartMatch = buffer.match(
                  /<thinking\s+type="([^"]+)">/,
                );
                if (
                  thinkingStartMatch &&
                  thinkingStartMatch.index !== undefined
                ) {
                  const before = buffer.substring(0, thinkingStartMatch.index);

                  // Send any text before thinking tag as explanation
                  if (before.trim()) {
                    explanationBuffer += before;
                    controller.enqueue(
                      encoder.encode(
                        sseEvent('explanation-chunk', { content: before }),
                      ),
                    );
                  }

                  buffer = buffer.substring(
                    thinkingStartMatch.index + thinkingStartMatch[0].length,
                  );
                  thinkingType = thinkingStartMatch[1];
                  thinkingBuffer = '';
                  continue;
                }

                // Check for thinking end tag
                if (thinkingType && buffer.includes('</thinking>')) {
                  const idx = buffer.indexOf('</thinking>');
                  const thinkingContent = buffer.substring(0, idx);

                  if (thinkingContent) {
                    thinkingBuffer += thinkingContent;
                    // Send thinking chunk
                    controller.enqueue(
                      encoder.encode(
                        sseEvent('thinking-chunk', {
                          thinkingType,
                          content: thinkingBuffer,
                        }),
                      ),
                    );
                  }

                  // Send thinking-complete
                  controller.enqueue(
                    encoder.encode(
                      sseEvent('thinking-complete', { thinkingType }),
                    ),
                  );

                  buffer = buffer.substring(idx + 12); // Remove </thinking>
                  thinkingType = null;
                  thinkingBuffer = '';
                  continue;
                }

                // While in thinking block, stream content
                if (thinkingType) {
                  // Check for potential partial closing tag - hold back if we might have incomplete tag
                  // </thinking> could be split like </thi or </think etc.
                  const potentialCloseIdx = buffer.lastIndexOf('<');
                  const hasPartialCloseTag =
                    potentialCloseIdx !== -1 &&
                    potentialCloseIdx > buffer.length - 12 && // </thinking> is 11 chars
                    !buffer.includes('>', potentialCloseIdx);

                  // Check if we have a complete thought to send
                  if (
                    (buffer.length > 30 ||
                      buffer.includes('\n') ||
                      buffer.endsWith('. ')) &&
                    !hasPartialCloseTag
                  ) {
                    // If there's a potential partial tag, only send content before it
                    let contentToSend = buffer;
                    let remainingBuffer = '';

                    if (potentialCloseIdx !== -1 && potentialCloseIdx > 0) {
                      // Check if the < might be start of </thinking>
                      const afterLt = buffer.substring(potentialCloseIdx);
                      if (afterLt.startsWith('</') || afterLt === '<') {
                        contentToSend = buffer.substring(0, potentialCloseIdx);
                        remainingBuffer = buffer.substring(potentialCloseIdx);
                      }
                    }

                    if (contentToSend.trim()) {
                      thinkingBuffer += contentToSend;
                      controller.enqueue(
                        encoder.encode(
                          sseEvent('thinking-chunk', {
                            thinkingType,
                            content: thinkingBuffer,
                          }),
                        ),
                      );
                    }
                    buffer = remainingBuffer;
                  }
                  break;
                }

                // Check for code block
                if (buffer.includes('```')) {
                  const idx = buffer.indexOf('```');
                  const before = buffer.substring(0, idx);

                  if (!inCodeBlock) {
                    // Starting code block - send any text before as explanation
                    if (before.trim()) {
                      explanationBuffer += before;
                      controller.enqueue(
                        encoder.encode(
                          sseEvent('explanation-chunk', { content: before }),
                        ),
                      );
                    }
                    buffer = buffer.substring(idx + 3);
                    // Skip language identifier or file path line if present
                    // Matches: tsx, typescript, file:package.json, file:app/page.tsx, etc.
                    const lineEnd = buffer.indexOf('\n');
                    if (lineEnd !== -1) {
                      const firstLine = buffer.substring(0, lineEnd).trim();
                      // Match simple language (tsx) or file:path format
                      if (
                        firstLine &&
                        /^(file:[^\s]+|[a-zA-Z0-9_+-]+)$/.test(firstLine)
                      ) {
                        buffer = buffer.substring(lineEnd + 1);
                      }
                    }
                    inCodeBlock = true;
                  } else {
                    // Ending code block - send as code-chunk event
                    accumulatedCode += before;
                    controller.enqueue(
                      encoder.encode(
                        sseEvent('code-chunk', { content: before }),
                      ),
                    );
                    buffer = buffer.substring(idx + 3);
                    inCodeBlock = false;
                  }
                  continue;
                }

                // Stream code or text
                if (inCodeBlock) {
                  if (buffer.length > 20 || buffer.includes('\n')) {
                    accumulatedCode += buffer;
                    controller.enqueue(
                      encoder.encode(
                        sseEvent('code-chunk', { content: buffer }),
                      ),
                    );
                    buffer = '';
                  }
                } else {
                  // Check for potential partial thinking tag or code block - hold back if incomplete
                  const potentialTagIndex = buffer.indexOf('<');
                  const potentialCodeIndex = buffer.indexOf('`');

                  const hasCompletePotentialTag =
                    potentialTagIndex === -1 ||
                    (potentialTagIndex !== -1 &&
                      buffer.includes('>', potentialTagIndex));

                  // Check if we have a partial code block (1-2 backticks at end)
                  const hasPartialCodeBlock =
                    (buffer.endsWith('`') && !buffer.endsWith('```')) ||
                    (buffer.endsWith('``') && !buffer.endsWith('```'));

                  // If buffer contains full ``` we should process it in the code block section
                  const hasFullCodeBlock = buffer.includes('```');

                  if (hasFullCodeBlock) {
                    // Let the code block handler above deal with this
                    // This shouldn't happen since we continue after code block detection
                    break;
                  }

                  if (
                    (buffer.length > 20 || buffer.includes('\n')) &&
                    hasCompletePotentialTag &&
                    !hasPartialCodeBlock
                  ) {
                    explanationBuffer += buffer;
                    controller.enqueue(
                      encoder.encode(
                        sseEvent('explanation-chunk', { content: buffer }),
                      ),
                    );
                    buffer = '';
                  } else if (
                    potentialTagIndex !== -1 &&
                    potentialTagIndex > 0 &&
                    !hasCompletePotentialTag
                  ) {
                    // Send content before the potential tag, keep the rest
                    const safeContent = buffer.substring(0, potentialTagIndex);
                    if (safeContent.trim()) {
                      explanationBuffer += safeContent;
                      controller.enqueue(
                        encoder.encode(
                          sseEvent('explanation-chunk', {
                            content: safeContent,
                          }),
                        ),
                      );
                    }
                    buffer = buffer.substring(potentialTagIndex);
                  } else if (
                    potentialCodeIndex !== -1 &&
                    potentialCodeIndex > 0 &&
                    buffer.length - potentialCodeIndex < 3
                  ) {
                    // We have a ` near the end - might be start of code block
                    // Send content before it, keep the potential code marker
                    const safeContent = buffer.substring(0, potentialCodeIndex);
                    if (safeContent.trim()) {
                      explanationBuffer += safeContent;
                      controller.enqueue(
                        encoder.encode(
                          sseEvent('explanation-chunk', {
                            content: safeContent,
                          }),
                        ),
                      );
                    }
                    buffer = buffer.substring(potentialCodeIndex);
                  }
                }
                break;
              }
            }
          }

          // Send any remaining buffer
          if (buffer.trim()) {
            if (inCodeBlock) {
              accumulatedCode += buffer;
              controller.enqueue(
                encoder.encode(sseEvent('code-chunk', { content: buffer })),
              );
            } else {
              controller.enqueue(
                encoder.encode(
                  sseEvent('explanation-chunk', { content: buffer }),
                ),
              );
            }
          }

          // Save complete response to history
          history.push({
            role: 'assistant',
            content: fullResponse,
          });
          chatHistories.set(currentChatId, history);

          // Track usage and calculate cost
          if (usageData) {
            trackUsage(currentChatId, {
              promptTokens: usageData.prompt_tokens || 0,
              completionTokens: usageData.completion_tokens || 0,
              totalTokens: usageData.total_tokens || 0,
              model: provider.model,
              timestamp: Date.now(),
            });
          }

          // Send done event with full metadata for frontend
          controller.enqueue(
            encoder.encode(
              sseEvent('done', {
                chatId: currentChatId,
                code: accumulatedCode,
                duration: Date.now() - requestStartTime,
                skill: {
                  type: intent.skillType,
                  stage: skillToStage[intent.skillType],
                },
                usage: usageData
                  ? {
                      cost: `$${(usageData.prompt_tokens * 0.00001 + usageData.completion_tokens * 0.00003).toFixed(4)}`,
                      tokens: `${usageData.total_tokens || 0}`,
                    }
                  : null,
              }),
            ),
          );
          controller.close();
        } catch (error) {
          // Log to Sentry
          Sentry.captureException(error, {
            tags: { source: 'chat-stream' },
            extra: { chatId: currentChatId },
          });

          controller.enqueue(
            encoder.encode(
              sseEvent('error', {
                error:
                  error instanceof Error
                    ? error.message
                    : 'Stream error occurred',
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: { source: 'chat-api' },
      extra: {
        clientIp: getClientIp(req),
      },
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 },
    );
  }
}
