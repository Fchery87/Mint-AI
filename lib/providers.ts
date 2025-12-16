/**
 * LLM Provider Configuration
 * Supports multiple providers via environment variables
 */

export interface LLMProvider {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

export type ProviderType = 'openrouter' | 'zai' | 'openai' | 'custom';

/**
 * Provider configurations based on environment variables
 */
const providers: Record<ProviderType, () => LLMProvider | null> = {
  openrouter: () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    return {
      name: 'OpenRouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      model: process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:free',
      headers: {
        'HTTP-Referer': 'https://mint-ai.app',
        'X-Title': 'Mint AI',
      },
    };
  },

  zai: () => {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) return null;
    return {
      name: 'Z.ai',
      // Use dedicated coding endpoint for code generation scenarios
      baseURL: 'https://api.z.ai/api/coding/paas/v4',
      apiKey,
      model: process.env.ZAI_MODEL || 'glm-4.6v',
    };
  },

  openai: () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return {
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  },

  custom: () => {
    const baseURL = process.env.CUSTOM_BASE_URL;
    const apiKey = process.env.CUSTOM_API_KEY;
    const model = process.env.CUSTOM_MODEL;
    if (!baseURL || !apiKey || !model) return null;
    return {
      name: 'Custom',
      baseURL,
      apiKey,
      model,
    };
  },
};

/**
 * Get the active LLM provider based on LLM_PROVIDER env var
 * Falls back to first available provider if not specified
 */
export function getActiveProvider(): LLMProvider {
  const providerName = (
    process.env.LLM_PROVIDER || 'openrouter'
  ).toLowerCase() as ProviderType;

  // Try the specified provider first
  if (providers[providerName]) {
    const provider = providers[providerName]();
    if (provider) return provider;
  }

  // Fallback: try each provider in order
  const fallbackOrder: ProviderType[] = [
    'openrouter',
    'zai',
    'openai',
    'custom',
  ];
  for (const name of fallbackOrder) {
    const provider = providers[name]();
    if (provider) return provider;
  }

  throw new Error(
    'No LLM provider configured. Please set one of: OPENROUTER_API_KEY, ZAI_API_KEY, OPENAI_API_KEY, or CUSTOM_* variables in .env.local'
  );
}

/**
 * Get the name of the currently active provider
 */
export function getActiveProviderName(): string {
  try {
    return getActiveProvider().name;
  } catch {
    return 'Not configured';
  }
}
