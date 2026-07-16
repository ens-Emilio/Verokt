import { eq } from 'drizzle-orm';
import { chat, maxIterations } from '@tanstack/ai';
import { swotSchema, pricingSchema, featuresSchema, reportSchema } from '@verokt/shared';
import { db } from '../db/client.js';
import { researches, reports } from '../db/schema.js';
import { getAdapter } from '../config/ai-providers.js';
import { getRelevantDocs } from '../lib/vector-search.js';
import type { AnalyzeJobData } from '../queues/research.queue.js';

async function fetchContext(researchId: string, targetCompany: string) {
  const contextDocs = await getRelevantDocs(
    researchId,
    `Analise competitiva de ${targetCompany}`,
  );

  const context = contextDocs
    .map((d) => d.content)
    .filter(Boolean)
    .join('\n---\n');

  return context;
}

async function generateSwot(targetCompany: string, competitors: string[], context: string) {
  const competitorText = competitors.length > 0 ? `Concorrentes: ${competitors.join(', ')}.` : '';

  return chat({
    adapter: getAdapter('swot-generation') as any,
    systemPrompts: [
      `Voce e um analista de mercado senior. Analise os dados coletados e gere uma analise SWOT estruturada da empresa ${targetCompany}. ${competitorText} Compare com os concorrentes mencionados.`,
    ],
    messages: [
      {
        role: 'user' as const,
        content: context
          ? `Documentos coletados:\n\n${context}`
          : `Analise a empresa ${targetCompany} com base em seu conhecimento geral.`,
      },
    ],
    outputSchema: swotSchema,
    agentLoopStrategy: maxIterations(5),
  });
}

async function generatePricing(targetCompany: string, competitors: string[], context: string) {
  return chat({
    adapter: getAdapter('pricing-extraction') as any,
    systemPrompts: [
      `Voce e um analista de precos. Extraia informacoes de precos, planos e modelos de negocio de ${targetCompany} e concorrentes (${competitors.join(', ')}) dos documentos abaixo. Preencha os campos com as melhores estimativas disponiveis.`,
    ],
    messages: [
      {
        role: 'user' as const,
        content: context
          ? `Documentos coletados:\n\n${context}`
          : `Analise os precos da empresa ${targetCompany} com base em seu conhecimento geral.`,
      },
    ],
    outputSchema: pricingSchema,
    agentLoopStrategy: maxIterations(5),
  });
}

async function generateFeatures(targetCompany: string, competitors: string[], context: string) {
  const allCompanies = [targetCompany, ...competitors];

  return chat({
    adapter: getAdapter('swot-generation') as any,
    systemPrompts: [
      `Voce e um analista de produto. Compare as features/capacidades das empresas abaixo. Para cada feature relevante, indique quais empresas oferecem (true) e quais nao oferecem (false). Empresas: ${allCompanies.join(', ')}.`,
    ],
    messages: [
      {
        role: 'user' as const,
        content: context
          ? `Documentos coletados:\n\n${context}`
          : `Compare as features da empresa ${targetCompany} e concorrentes ${competitors.join(', ')} com base em seu conhecimento geral.`,
      },
    ],
    outputSchema: featuresSchema,
    agentLoopStrategy: maxIterations(5),
  });
}

async function generateSummary(
  targetCompany: string,
  competitors: string[],
  swot: unknown,
  pricing: unknown,
  features: unknown,
) {
  return chat({
    adapter: getAdapter('summary') as any,
    systemPrompts: [
      `Voce e um consultor estrategico. Com base nas analises geradas, escreva um resumo executivo conciso (maximo 4 paragrafos) sobre a posicao competitiva de ${targetCompany} frente aos concorrentes ${competitors.join(', ')}.`,
    ],
    messages: [
      {
        role: 'user' as const,
        content: `Analise SWOT: ${JSON.stringify(swot, null, 2)}\n\nAnalise de precos: ${JSON.stringify(pricing, null, 2)}\n\nComparativo de features: ${JSON.stringify(features, null, 2)}`,
      },
    ],
    outputSchema: reportSchema.shape.summary,
    agentLoopStrategy: maxIterations(5),
  });
}

export async function handleAnalyze(data: AnalyzeJobData) {
  const { researchId, targetCompany } = data;

  await db
    .update(researches)
    .set({ status: 'reporting', updatedAt: new Date() })
    .where(eq(researches.id, researchId));

  console.log(`[Analyzer] Analyzing: ${targetCompany}`);

  const [research] = await db
    .select()
    .from(researches)
    .where(eq(researches.id, researchId))
    .limit(1);

  const competitors = research?.competitors ?? [];
  const context = await fetchContext(researchId, targetCompany);

  try {
    const [swotResult, pricingResult, featuresResult] = await Promise.all([
      generateSwot(targetCompany, competitors, context),
      generatePricing(targetCompany, competitors, context),
      generateFeatures(targetCompany, competitors, context),
    ]);

    const summaryResult = await generateSummary(
      targetCompany,
      competitors,
      swotResult,
      pricingResult,
      featuresResult,
    );

    await db
      .insert(reports)
      .values({
        researchId,
        swot: swotResult,
        pricing: pricingResult,
        features: featuresResult,
        summary: summaryResult,
      })
      .onConflictDoUpdate({
        target: reports.researchId,
        set: {
          swot: swotResult,
          pricing: pricingResult,
          features: featuresResult,
          summary: summaryResult,
          updatedAt: new Date(),
        },
      });

    console.log(`[Analyzer] Report saved for: ${targetCompany}`);
  } catch (err) {
    console.error(`[Analyzer] Failed analyzing research ${researchId}:`, err);

    // Save a partial report so the frontend shows something and status can complete
    await db
      .insert(reports)
      .values({
        researchId,
        summary: `Nao foi possivel gerar a analise completa para ${targetCompany}. Erro: ${err instanceof Error ? err.message : 'unknown'}`,
      })
      .onConflictDoUpdate({
        target: reports.researchId,
        set: {
          summary: `Nao foi possivel gerar a analise completa para ${targetCompany}. Erro: ${err instanceof Error ? err.message : 'unknown'}`,
          updatedAt: new Date(),
        },
      });
  }

  await db
    .update(researches)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(researches.id, researchId));

  console.log(`[Analyzer] Research completed: ${researchId}`);
}
