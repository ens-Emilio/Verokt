import OpenAI from 'openai';
import { env } from '../config/env.js';
import { EMBEDDING_DIMENSIONS, MIN_CONTENT_LENGTH_FOR_EMBEDDING } from '@verokt/shared';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (text.length < MIN_CONTENT_LENGTH_FOR_EMBEDDING) {
    return null;
  }

  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const validTexts = texts.map((t) =>
    t.length >= MIN_CONTENT_LENGTH_FOR_EMBEDDING ? t : null,
  );

  const indices = validTexts
    .map((t, i) => (t !== null ? i : -1))
    .filter((i) => i !== -1);

  if (indices.length === 0) return texts.map(() => null);

  const batch = indices.map((i) => validTexts[i]!);
  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: batch,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const results: (number[] | null)[] = texts.map(() => null);
  response.data.forEach((item, batchIdx) => {
    const originalIdx = indices[batchIdx];
    if (originalIdx !== undefined) {
      results[originalIdx] = item.embedding;
    }
  });

  return results;
}
