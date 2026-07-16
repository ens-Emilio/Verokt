import { describe, it, expect } from 'vitest';
import { createResearchSchema, researchStatusSchema } from './research.schema';

describe('research schema', () => {
  it('validates a correct research input', () => {
    const result = createResearchSchema.safeParse({
      targetCompany: 'Nubank',
      competitors: ['Itau', 'Bradesco'],
    });

    expect(result.success).toBe(true);
  });

  it('requires at least one competitor', () => {
    const result = createResearchSchema.safeParse({
      targetCompany: 'Nubank',
      competitors: [],
    });

    expect(result.success).toBe(false);
  });

  it('limits competitors to 10', () => {
    const result = createResearchSchema.safeParse({
      targetCompany: 'Nubank',
      competitors: Array(11).fill('Bank'),
    });

    expect(result.success).toBe(false);
  });

  it('rejects short company names', () => {
    const result = createResearchSchema.safeParse({
      targetCompany: 'A',
      competitors: ['Itau'],
    });

    expect(result.success).toBe(false);
  });
});

describe('research status schema', () => {
  it('accepts valid status values', () => {
    expect(researchStatusSchema.parse('queued')).toBe('queued');
    expect(researchStatusSchema.parse('completed')).toBe('completed');
  });

  it('rejects invalid status values', () => {
    expect(() => researchStatusSchema.parse('unknown')).toThrow();
  });
});
