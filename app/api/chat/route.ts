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
import { sanitizeErrorForLogging, getSafeErrorMessage } from '@/lib/security';
import {
  createParseState,
  parseSSEChunk,
  flushParseState,
  formatSSEEvent,
} from '@/lib/streaming/parser';

// SSE helper: Format event with proper named event syntax for EventSource
function sseEvent(eventType: string, data: Record<string, unknown>): string {
  return formatSSEEvent(eventType, data);
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

// Request validation schema with size limits
const MAX_MESSAGE_LENGTH = 5000;
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB limit

const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(
      MAX_MESSAGE_LENGTH,
      `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
    ),
  chatId: z.string().optional(),
  outputFormat: z.string().optional(),
  mode: z.enum(['plan', 'build']).optional(),
  webSearch: z.boolean().optional(),
  forceSkill: z.string().optional(), // Optional: force a specific skill
  // Plan context for Build mode
  planId: z.string().optional(),
  currentStepIndex: z.number().optional(),
});

export interface ChatRequest {
  message: string;
  chatId?: string;
  outputFormat?: OutputFormat;
  mode?: 'plan' | 'build';
  webSearch?: boolean;
  forceSkill?: string;
  // Plan context for Build mode
  planId?: string;
  currentStepIndex?: number;
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

  interface WebSearchResult {
    title: string | undefined;
    url: string;
  }

  interface WebSearchResponse {
    results: Array<{
      title?: string;
      url?: string;
    }>;
  }

  const data = (await searchRes.json()) as WebSearchResponse;
  const results = Array.isArray(data?.results) ? data.results : [];
  const sources = results
    .map((r) => ({
      title: typeof r?.title === 'string' ? r.title : undefined,
      url: typeof r?.url === 'string' ? r.url : '',
    }))
    .filter((r): r is WebSearchResult => r.url.length > 0);

  const contextLines = sources.map((s, idx) => {
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

// Simple in-memory chat history storage with TTL
const chatHistories = new Map<
  string,
  {
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    expiresAt: number;
  }
>();

const CHAT_HISTORY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORIES = 1000; // Max concurrent chats to prevent memory exhaustion
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cleanup expired chat histories
function cleanupExpiredChats() {
  const now = Date.now();
  for (const [id, data] of chatHistories.entries()) {
    if (now > data.expiresAt) {
      chatHistories.delete(id);
    }
  }
}

// Run cleanup periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredChats();
    // Also limit total histories if over capacity (oldest first)
    if (chatHistories.size > MAX_HISTORIES) {
      const entries = Array.from(chatHistories.entries()).sort(
        (a, b) => a[1].expiresAt - b[1].expiresAt,
      );
      const toRemove = entries.slice(0, chatHistories.size - MAX_HISTORIES);
      for (const [id] of toRemove) {
        chatHistories.delete(id);
      }
    }
  }, CLEANUP_INTERVAL);
}

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
  // Check Content-Length for request size limits
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10);
    if (sizeInBytes > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request too large. Maximum size is 1MB.' },
        { status: 413 },
      );
    }
  }

  try {
    // Rate limiting: 10 requests per minute per IP
    const clientIp = getClientIp(req);
    const rateLimit = await checkRateLimit(clientIp, 10, 60000);

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
    const mode: 'plan' | 'build' = validationResult.data.mode || 'build';
    const webSearchRequested: boolean = Boolean(
      validationResult.data.webSearch,
    );
    const forceSkill: string | undefined = validationResult.data.forceSkill;

    // Track request start time for duration calculation
    const requestStartTime = Date.now();

    // Get or create chat history
    const currentChatId = chatId || generateChatId();
    let history = chatHistories.get(currentChatId)?.history || [];

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
          extra: { provider: provider.name, error: sanitizeErrorForLogging(e) },
        });
      }
    }

    // Build mode: Add approved plan context
    let planContext: string | null = null;
    if (mode === 'build' && validationResult.data.planId) {
      // TODO: Retrieve actual plan from storage/database
      // For now, we'll rely on the client to send the full plan in the message
      planContext = `You are now in BUILD MODE. Execute the approved plan step-by-step.

IMPORTANT RULES:
- Follow the plan exactly as specified
- Complete each step before moving to the next
- Generate files matching the specified paths
- Report progress for each step
- If you encounter issues, explain them clearly

Current step index: ${validationResult.data.currentStepIndex || 0}`;
    }

    // Call LLM API with streaming (include usage data)
    const stream = await client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(webSearchContext
          ? [{ role: 'system', content: webSearchContext } as const]
          : []),
        ...(planContext
          ? [{ role: 'system', content: planContext } as const]
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
    interface UsageData {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }

    let usageData: UsageData | null = null;
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

          // Initialize parser state
          let parseState = createParseState();

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';

            // Capture usage data if present (sent in final chunk)
            if (chunk.usage) {
              usageData = chunk.usage;
            }

            if (content) {
              fullResponse += content;

              // Parse the chunk using the state machine parser
              const result = parseSSEChunk(content, parseState);
              parseState = result.newState;

              // Send all generated events
              for (const event of result.events) {
                controller.enqueue(encoder.encode(sseEvent(event.type, event)));

                // Track code chunks for final accumulation
                if (event.type === 'code-chunk') {
                  accumulatedCode += event.content;
                }
              }
            }
          }

          // Flush any remaining content
          const finalEvents = flushParseState(parseState);
          for (const event of finalEvents) {
            controller.enqueue(encoder.encode(sseEvent(event.type, event)));

            if (event.type === 'code-chunk') {
              accumulatedCode += event.content;
            }
          }

          // Save complete response to history
          history.push({
            role: 'assistant',
            content: fullResponse,
          });
          chatHistories.set(currentChatId, {
            history,
            expiresAt: Date.now() + CHAT_HISTORY_TTL,
          });

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
          // Log to Sentry with sanitized error
          Sentry.captureException(error, {
            tags: { source: 'chat-stream' },
            extra: {
              chatId: currentChatId,
              error: sanitizeErrorForLogging(error),
            },
          });

          controller.enqueue(
            encoder.encode(
              sseEvent('error', {
                error: getSafeErrorMessage(error),
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
    // Safe console logging without exposing API keys
    console.error(
      'Chat error:',
      JSON.stringify(sanitizeErrorForLogging(error), null, 2),
    );

    // Log to Sentry with sanitized error
    Sentry.captureException(error, {
      tags: { source: 'chat-api' },
      extra: {
        clientIp: getClientIp(req),
        error: sanitizeErrorForLogging(error),
      },
    });

    return NextResponse.json(
      {
        error: getSafeErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
