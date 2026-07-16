import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';
import { env } from '../config/env.js';

export const redisConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: { count: 100, age: 86400 },
  removeOnFail: { count: 500 },
};
