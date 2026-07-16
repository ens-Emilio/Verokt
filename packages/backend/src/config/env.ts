import { config } from 'dotenv';
import { existsSync } from 'node:fs';

for (const p of ['.env', '../../.env']) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://verokt:verokt@localhost:5432/verokt'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  BACKEND_PORT: z.coerce.number().default(3000),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  COMPATIBLE_PROVIDER_NAME: z.string().default('compatible'),
  COMPATIBLE_BASE_URL: z.string().url(),
  COMPATIBLE_API_KEY: z.string(),
  COMPATIBLE_MODELS: z.string().default(''),
  COMPATIBLE_MODEL: z.string(),

  NATIVE_PROVIDER: z.string().default('anthropic'),
  NATIVE_API_KEY: z.string(),
  NATIVE_MODEL: z.string(),

  JWT_SECRET: z.string().default('dev-secret-change-me'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = loadEnv();

export const compatibleModels = env.COMPATIBLE_MODELS
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
