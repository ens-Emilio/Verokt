import { z } from 'zod';

export const researchStatusSchema = z.enum([
  'queued',
  'scraping',
  'analyzing',
  'reporting',
  'completed',
  'failed',
]);

export const sourceTypeSchema = z.enum(['website', 'pricing', 'blog', 'news']);

export const createResearchSchema = z.object({
  targetCompany: z.string().min(2, 'Nome da empresa deve ter no minimo 2 caracteres'),
  competitors: z
    .array(z.string().min(2))
    .min(1, 'Adicione pelo menos 1 concorrente')
    .max(10, 'Maximo de 10 concorrentes'),
});

export const researchParamsSchema = z.object({
  id: z.string().uuid(),
});

export const researchResponseSchema = z.object({
  id: z.string().uuid(),
  targetCompany: z.string(),
  competitors: z.array(z.string()),
  status: researchStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResearchStatus = z.infer<typeof researchStatusSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type CreateResearchInput = z.infer<typeof createResearchSchema>;
export type ResearchResponse = z.infer<typeof researchResponseSchema>;
