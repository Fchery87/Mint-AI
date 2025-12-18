/**
 * Cost tracking utility for LLM API usage
 * Tracks tokens and estimates costs per session
 */

// Pricing per 1M tokens (input/output) - Update these based on your provider
export const MODEL_PRICING = {
  // OpenRouter pricing (approximate averages)
  'qwen/qwen3-coder:free': { input: 0, output: 0 }, // Free tier
  'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },
  'google/gemini-flash-1.5-8b': { input: 0, output: 0 }, // Free tier

  // Z.ai pricing
  'glm-4.6v': { input: 0.5, output: 1.5 },

  // OpenAI pricing
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },

  // Default fallback
  default: { input: 0.5, output: 1.5 },
} as const;

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

/**
 * Calculate cost for a given usage
 */
export function calculateCost(usage: UsageMetrics): CostEstimate {
  const pricing = (MODEL_PRICING as any)[usage.model] || MODEL_PRICING.default;

  // Convert pricing from per 1M tokens to per token
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
    currency: 'USD',
  };
}

/**
 * In-memory session cost tracking
 * Maps chatId -> array of usage metrics
 */
const sessionUsage = new Map<string, UsageMetrics[]>();

/**
 * Track usage for a session
 */
export function trackUsage(chatId: string, usage: UsageMetrics): void {
  const existing = sessionUsage.get(chatId) || [];
  existing.push(usage);
  sessionUsage.set(chatId, existing);
}

/**
 * Get total cost for a session
 */
export function getSessionCost(chatId: string): CostEstimate {
  const usageList = sessionUsage.get(chatId) || [];

  let totalInputCost = 0;
  let totalOutputCost = 0;

  for (const usage of usageList) {
    const cost = calculateCost(usage);
    totalInputCost += cost.inputCost;
    totalOutputCost += cost.outputCost;
  }

  return {
    inputCost: Number(totalInputCost.toFixed(6)),
    outputCost: Number(totalOutputCost.toFixed(6)),
    totalCost: Number((totalInputCost + totalOutputCost).toFixed(6)),
    currency: 'USD',
  };
}

/**
 * Get total tokens used in a session
 */
export function getSessionTokens(chatId: string): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const usageList = sessionUsage.get(chatId) || [];

  return usageList.reduce(
    (acc, usage) => ({
      promptTokens: acc.promptTokens + usage.promptTokens,
      completionTokens: acc.completionTokens + usage.completionTokens,
      totalTokens: acc.totalTokens + usage.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  );
}

/**
 * Clear session usage data
 */
export function clearSessionUsage(chatId: string): void {
  sessionUsage.delete(chatId);
}

/**
 * Get all session IDs being tracked
 */
export function getAllSessions(): string[] {
  return Array.from(sessionUsage.keys());
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'Free';
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K tokens`;
  return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
}
