import { Worker } from 'bullmq';
import { redisConnection } from '../queues/config.js';
import { runCustomMigrations } from '../db/migrate.js';
import { JOB_NAMES } from '../queues/research.queue.js';
import type { ScrapeJobData, IndexJobData, AnalyzeJobData } from '../queues/research.queue.js';
import { handleScrape } from './scraper.js';
import { handleIndex } from './indexer.js';
import { handleAnalyze } from './analyzer.js';

await runCustomMigrations();

const worker = new Worker(
  'research',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name} (${job.id})`);

    try {
      switch (job.name) {
        case JOB_NAMES.SCRAPE:
          await handleScrape(job.data as ScrapeJobData);
          break;
        case JOB_NAMES.INDEX:
          await handleIndex(job.data as IndexJobData);
          break;
        case JOB_NAMES.ANALYZE:
          await handleAnalyze(job.data as AnalyzeJobData);
          break;
        default:
          console.warn(`[Worker] Unknown job name: ${job.name}`);
      }
    } catch (error) {
      console.error(`[Worker] Job ${job.name} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job completed: ${job.name} (${job.id})`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job failed: ${job?.name} (${job?.id})`, err);
});

console.log('[Worker] Research worker started');

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});
