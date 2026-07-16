import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { researches, documents } from '../db/schema.js';
import { addAnalyzeJob, type IndexJobData } from '../queues/research.queue.js';
import { generateEmbeddings } from '../lib/embeddings.js';

export async function handleIndex(data: IndexJobData) {
  const { researchId } = data;

  await db
    .update(researches)
    .set({ status: 'analyzing', updatedAt: new Date() })
    .where(eq(researches.id, researchId));

  console.log(`[Indexer] Processing research: ${researchId}`);

  const [research] = await db
    .select()
    .from(researches)
    .where(eq(researches.id, researchId))
    .limit(1);

  const pendingDocs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.researchId, researchId), isNull(documents.embedding)));

  console.log(`[Indexer] Found ${pendingDocs.length} documents without embeddings`);

  if (pendingDocs.length > 0) {
    const contents = pendingDocs.map((d: { content: string | null }) => d.content ?? '');
    const embeddings = await generateEmbeddings(contents);

    for (let i = 0; i < pendingDocs.length; i++) {
      const doc = pendingDocs[i];
      const embedding = embeddings[i];
      if (!doc || !embedding) continue;

      await db
        .update(documents)
        .set({ embedding })
        .where(eq(documents.id, doc.id));
    }

    console.log(`[Indexer] Updated ${pendingDocs.length} document embeddings`);
  }

  await addAnalyzeJob({
    researchId,
    targetCompany: research?.targetCompany ?? 'Unknown',
  });
}
