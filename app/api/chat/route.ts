import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { checkRateLimit, getClientIp, formatRetryAfter } from '@/lib/ratelimit';
import { getActiveProvider, type LLMProvider } from '@/lib/providers';
import { trackUsage, getSessionCost, formatCost, formatTokens } from '@/lib/cost-tracking';

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
});

export interface ChatRequest {
  message: string;
  chatId?: string;
}

export interface ChatResponse {
  id: string;
  code: string;
  message: string;
}

// Simple in-memory chat history storage
const chatHistories = new Map<
  string,
  Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
>();

function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function extractCodeFromResponse(text: string): string {
  // Extract code from markdown code blocks
  const codeBlockRegex = /```(?:typescript|tsx|jsx|react)?\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code block found, return the whole response
  return text.trim();
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
        }
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
        { status: 400 }
      );
    }

    const { message, chatId } = validationResult.data;

    // Get or create chat history
    const currentChatId = chatId || generateChatId();
    let history = chatHistories.get(currentChatId) || [];

    // Add user message to history
    history.push({
      role: 'user',
      content: message,
    });

    // Get the active provider and client
    const { client, provider } = getOpenAIClient();

    // Call LLM API with streaming (include usage data)
    const stream = await client.chat.completions.create({
      model: provider.model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
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

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          let inReasoning = false;
          let inCodeBlock = false;
          let reasoningBuffer = '';
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
                // Check for reasoning start tag
                if (!inReasoning && buffer.includes('<reasoning>')) {
                  const idx = buffer.indexOf('<reasoning>');
                  const before = buffer.substring(0, idx);

                  // Send any text before reasoning tag as explanation
                  if (before.trim()) {
                    explanationBuffer += before;
                    const data = JSON.stringify({
                      type: 'explanation-chunk',
                      content: before,
                      chatId: currentChatId,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }

                  buffer = buffer.substring(idx + 11); // Remove <reasoning>
                  inReasoning = true;
                  continue;
                }

                // Check for reasoning end tag
                if (inReasoning && buffer.includes('</reasoning>')) {
                  const idx = buffer.indexOf('</reasoning>');
                  const reasoningContent = buffer.substring(0, idx);

                  reasoningBuffer += reasoningContent;
                  const data = JSON.stringify({
                    type: 'reasoning-chunk',
                    content: reasoningContent,
                    chatId: currentChatId,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                  // Send reasoning complete event
                  const completeData = JSON.stringify({
                    type: 'reasoning-complete',
                    chatId: currentChatId,
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${completeData}\n\n`)
                  );

                  buffer = buffer.substring(idx + 12); // Remove </reasoning>
                  inReasoning = false;
                  continue;
                }

                // If in reasoning, accumulate and stream
                if (inReasoning) {
                  // Stream reasoning content in smaller chunks
                  if (buffer.length > 20 || buffer.includes('\n')) {
                    reasoningBuffer += buffer;
                    const data = JSON.stringify({
                      type: 'reasoning-chunk',
                      content: buffer,
                      chatId: currentChatId,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    buffer = '';
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
                      const data = JSON.stringify({
                        type: 'explanation-chunk',
                        content: before,
                        chatId: currentChatId,
                      });
                      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                    buffer = buffer.substring(idx + 3);
                    inCodeBlock = true;
                  } else {
                    // Ending code block - send accumulated code
                    const codeData = JSON.stringify({
                      type: 'code-chunk',
                      content: before,
                      chatId: currentChatId,
                    });
                    controller.enqueue(encoder.encode(`data: ${codeData}\n\n`));
                    buffer = buffer.substring(idx + 3);
                    inCodeBlock = false;
                  }
                  continue;
                }

                // Stream code or explanation based on state
                if (inCodeBlock) {
                  if (buffer.length > 30 || buffer.includes('\n')) {
                    const codeData = JSON.stringify({
                      type: 'code-chunk',
                      content: buffer,
                      chatId: currentChatId,
                    });
                    controller.enqueue(encoder.encode(`data: ${codeData}\n\n`));
                    buffer = '';
                  }
                } else {
                  if (buffer.length > 30 || buffer.includes('\n')) {
                    explanationBuffer += buffer;
                    const data = JSON.stringify({
                      type: 'explanation-chunk',
                      content: buffer,
                      chatId: currentChatId,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    buffer = '';
                  }
                }
                break;
              }
            }
          }

          // Send any remaining buffer
          if (buffer.trim()) {
            const data = JSON.stringify({
              type: inCodeBlock ? 'code-chunk' : 'explanation-chunk',
              content: buffer,
              chatId: currentChatId,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Save complete response to history
          history.push({
            role: 'assistant',
            content: fullResponse,
          });
          chatHistories.set(currentChatId, history);

          // Extract code from the response
          const code = extractCodeFromResponse(fullResponse);

          // Track usage and calculate cost
          let costData = null;
          if (usageData) {
            trackUsage(currentChatId, {
              promptTokens: usageData.prompt_tokens || 0,
              completionTokens: usageData.completion_tokens || 0,
              totalTokens: usageData.total_tokens || 0,
              model: provider.model,
              timestamp: Date.now(),
            });

            const sessionCost = getSessionCost(currentChatId);
            costData = {
              cost: formatCost(sessionCost.totalCost),
              tokens: formatTokens(usageData.total_tokens),
              rawCost: sessionCost.totalCost,
              rawTokens: usageData.total_tokens,
            };
          }

          // Send final message with code and cost data
          const finalData = JSON.stringify({
            type: 'done',
            chatId: currentChatId,
            code,
            explanation: explanationBuffer,
            usage: costData,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.close();
        } catch (error) {
          // Log to Sentry
          Sentry.captureException(error, {
            tags: { source: 'chat-stream' },
            extra: { chatId: currentChatId },
          });

          const errorData = JSON.stringify({
            type: 'error',
            error:
              error instanceof Error ? error.message : 'Stream error occurred',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
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
      { status: 500 }
    );
  }
}
