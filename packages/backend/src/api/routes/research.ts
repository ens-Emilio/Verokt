import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { eq, desc } from 'drizzle-orm';
import { createResearchSchema } from '@verokt/shared';
import { db } from '../../db/client.js';
import { researches, reports } from '../../db/schema.js';
import { addScrapeJob } from '../../queues/research.queue.js';
import { redis } from '../../queues/config.js';
import type { AuthVariables } from '../middleware/auth.js';

const research = new Hono<{ Variables: AuthVariables }>();

research.get('/', async (c) => {
  const userId = c.get('userId');

  const results = await db
    .select({
      id: researches.id,
      targetCompany: researches.targetCompany,
      competitors: researches.competitors,
      status: researches.status,
      createdAt: researches.createdAt,
      updatedAt: researches.updatedAt,
    })
    .from(researches)
    .where(eq(researches.userId, userId))
    .orderBy(desc(researches.createdAt))
    .limit(50);

  return c.json(results);
});

research.post('/', zValidator('json', createResearchSchema), async (c) => {
  const { targetCompany, competitors } = c.req.valid('json');
  const userId = c.get('userId');

  const [created] = await db
    .insert(researches)
    .values({
      userId,
      targetCompany,
      competitors,
    })
    .returning();

  await addScrapeJob({
    researchId: created.id,
    targetCompany,
    competitors,
  });

  return c.json(created, 201);
});

research.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [result] = await db
    .select()
    .from(researches)
    .where(eq(researches.id, id))
    .limit(1);

  if (!result) {
    return c.json({ error: 'Research not found' }, 404);
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.researchId, id))
    .limit(1);

  return c.json({ ...result, report: report ?? null });
});

research.get('/:id/status', async (c) => {
  const id = c.req.param('id');

  const [result] = await db
    .select({
      id: researches.id,
      status: researches.status,
      targetCompany: researches.targetCompany,
      updatedAt: researches.updatedAt,
    })
    .from(researches)
    .where(eq(researches.id, id))
    .limit(1);

  if (!result) {
    return c.json({ error: 'Research not found' }, 404);
  }

  return c.json(result);
});

research.get('/:id/events', (c) => {
  const id = c.req.param('id');

  return streamSSE(c, async (stream) => {
    const channel = `research:${id}`;

    const lastEventId = c.req.header('Last-Event-ID');
    let lastId = lastEventId ? parseInt(lastEventId, 10) : 0;

    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);

    const sendUpdate = async () => {
      const [result] = await db
        .select({ status: researches.status })
        .from(researches)
        .where(eq(researches.id, id))
        .limit(1);

      if (result) {
        lastId++;
        await stream.writeSSE({
          id: String(lastId),
          event: 'status',
          data: JSON.stringify(result),
        });

        if (result.status === 'completed' || result.status === 'failed') {
          await subscriber.unsubscribe(channel);
          return;
        }
      }
    };

    await sendUpdate();

    const interval = setInterval(sendUpdate, 3000);

    stream.onAbort(() => {
      clearInterval(interval);
      subscriber.unsubscribe(channel);
      subscriber.disconnect();
    });

    while (!stream.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
});

export { research };
