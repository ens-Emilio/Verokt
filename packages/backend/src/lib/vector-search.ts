import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { generateEmbedding } from './embeddings.js';
import { MAX_CONTEXT_DOCS } from '@verokt/shared';

interface RelevantDoc {
  id: string;
  source: string;
  content: string;
}

export async function getRelevantDocs(
  researchId: string,
  query: string,
): Promise<RelevantDoc[]> {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  const result = await db.execute(sql`
    SELECT id, source, content
    FROM documents
    WHERE research_id = ${researchId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${MAX_CONTEXT_DOCS}
  `);

  return result as unknown as RelevantDoc[];
}
