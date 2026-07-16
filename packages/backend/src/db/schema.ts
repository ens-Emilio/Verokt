import { pgTable, uuid, text, timestamp, jsonb, index, vector } from 'drizzle-orm/pg-core';

export const researches = pgTable('researches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  targetCompany: text('target_company').notNull(),
  competitors: text('competitors').array().notNull(),
  status: text('status').$type<
    'queued' | 'scraping' | 'analyzing' | 'reporting' | 'completed' | 'failed'
  >().default('queued'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    researchId: uuid('research_id').references(() => researches.id),
    source: text('source').notNull(),
    sourceType: text('source_type').$type<'website' | 'pricing' | 'blog' | 'news'>(),
    content: text('content'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('documents_research_id_idx').on(table.researchId),
  ],
);

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  researchId: uuid('research_id').references(() => researches.id).unique(),
  swot: jsonb('swot'),
  pricing: jsonb('pricing'),
  features: jsonb('features'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
