import { Queue } from 'bullmq';
import { redisConnection, defaultJobOptions } from './config.js';

export interface ScrapeJobData {
  researchId: string;
  targetCompany: string;
  competitors: string[];
}

export interface IndexJobData {
  researchId: string;
}

export interface AnalyzeJobData {
  researchId: string;
  targetCompany: string;
}

export type ResearchJobData = ScrapeJobData | IndexJobData | AnalyzeJobData;

export const researchQueue = new Queue('research', {
  connection: redisConnection,
  defaultJobOptions,
});

export const JOB_NAMES = {
  SCRAPE: 'scrape',
  INDEX: 'index',
  ANALYZE: 'analyze',
} as const;

export async function addScrapeJob(data: ScrapeJobData) {
  return researchQueue.add(JOB_NAMES.SCRAPE, data, {
    jobId: `scrape:${data.researchId}`,
  });
}

export async function addIndexJob(data: IndexJobData) {
  return researchQueue.add(JOB_NAMES.INDEX, data, {
    jobId: `index:${data.researchId}`,
  });
}

export async function addAnalyzeJob(data: AnalyzeJobData) {
  return researchQueue.add(JOB_NAMES.ANALYZE, data, {
    jobId: `analyze:${data.researchId}`,
  });
}
