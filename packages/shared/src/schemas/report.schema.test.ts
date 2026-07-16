import { describe, it, expect } from 'vitest';
import { reportSchema, swotSchema } from './report.schema';

describe('swot schema', () => {
  it('validates a complete swot', () => {
    const result = swotSchema.safeParse({
      strengths: ['bom atendimento'],
      weaknesses: ['taxas altas'],
      opportunities: ['expansao digital'],
      threats: ['concorrencia feroz'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts empty arrays', () => {
    const result = swotSchema.safeParse({
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    });

    expect(result.success).toBe(true);
  });
});

describe('report schema', () => {
  it('validates a complete report', () => {
    const result = reportSchema.safeParse({
      swot: {
        strengths: ['bom atendimento'],
        weaknesses: ['taxas altas'],
        opportunities: ['expansao digital'],
        threats: ['concorrencia feroz'],
      },
      pricing: {
        entries: [
          { company: 'Nubank', price: '0', currency: 'BRL', period: 'mes' },
        ],
        summary: 'Precos competitivos',
      },
      features: {
        comparison: [
          { feature: 'App mobile', companies: { Nubank: true, Itau: true } },
        ],
        summary: 'Features similares',
      },
      summary: 'Resumo executivo',
    });

    expect(result.success).toBe(true);
  });
});
