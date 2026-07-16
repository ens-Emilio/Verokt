import { z } from 'zod';

export const swotSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
});

export const pricingEntrySchema = z.object({
  company: z.string(),
  price: z.string(),
  currency: z.string().default('BRL'),
  period: z.string().default('mes'),
  notes: z.string().optional(),
});

export const pricingSchema = z.object({
  entries: z.array(pricingEntrySchema),
  summary: z.string(),
});

export const featuresSchema = z.object({
  comparison: z.array(
    z.object({
      feature: z.string(),
      companies: z.record(z.string(), z.boolean()),
    })
  ),
  summary: z.string(),
});

export const reportSchema = z.object({
  swot: swotSchema,
  pricing: pricingSchema,
  features: featuresSchema,
  summary: z.string(),
});

export type Swot = z.infer<typeof swotSchema>;
export type PricingEntry = z.infer<typeof pricingEntrySchema>;
export type Pricing = z.infer<typeof pricingSchema>;
export type Features = z.infer<typeof featuresSchema>;
export type Report = z.infer<typeof reportSchema>;
