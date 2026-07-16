import { openaiCompatible } from '@tanstack/ai-openai/compatible';
import { anthropicText } from '@tanstack/ai-anthropic';
import { env, compatibleModels } from './env.js';

export type AITask =
  | 'scraping-analysis'
  | 'swot-generation'
  | 'pricing-extraction'
  | 'summary';

const compatible = openaiCompatible({
  name: env.COMPATIBLE_PROVIDER_NAME,
  baseURL: env.COMPATIBLE_BASE_URL,
  apiKey: env.COMPATIBLE_API_KEY,
  models: compatibleModels.length > 0 ? compatibleModels : [env.COMPATIBLE_MODEL],
});

function getNativeAdapter(model: string) {
  switch (env.NATIVE_PROVIDER) {
    case 'anthropic':
      return anthropicText(model as never, { apiKey: env.NATIVE_API_KEY });
    default:
      return anthropicText(model as never, { apiKey: env.NATIVE_API_KEY });
  }
}

const taskProviderMap: Record<AITask, 'compatible' | 'native'> = {
  'scraping-analysis': 'compatible',
  'swot-generation': 'native',
  'pricing-extraction': 'compatible',
  'summary': 'native',
};

export function getAdapter(task: AITask): any {
  const providerType = taskProviderMap[task];
  if (providerType === 'compatible') {
    return compatible(env.COMPATIBLE_MODEL);
  }
  return getNativeAdapter(env.NATIVE_MODEL);
}
