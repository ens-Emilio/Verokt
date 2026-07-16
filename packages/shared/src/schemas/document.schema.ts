import { z } from 'zod';
import { sourceTypeSchema } from './research.schema';

export const documentSchema = z.object({
  id: z.string().uuid(),
  researchId: z.string().uuid(),
  source: z.string().url(),
  sourceType: sourceTypeSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
});

export const createDocumentSchema = z.object({
  researchId: z.string().uuid(),
  source: z.string().url(),
  sourceType: sourceTypeSchema,
  content: z.string().min(1),
});

export type Document = z.infer<typeof documentSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
