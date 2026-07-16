import { createFileRoute } from '@tanstack/react-router';
import { useResearch } from '../hooks/research';
import type { Swot, Pricing, Features } from '@verokt/shared';

export const Route = createFileRoute('/research/$id')({
  component: ResearchDetailComponent,
});

const STATUS_LABELS: Record<string, string> = {
  queued: 'Na fila',
  scraping: 'Coletando dados...',
  analyzing: 'Indexando documentos...',
  reporting: 'Gerando relatorio...',
  completed: 'Concluido',
  failed: 'Falhou',
};

const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-700',
  scraping: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-blue-100 text-blue-700',
  reporting: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function SwotCard({ swot }: { swot: Swot }) {
  const sections = [
    { title: 'Forcas', items: swot.strengths, color: 'text-green-600' },
    { title: 'Fraquezas', items: swot.weaknesses, color: 'text-red-600' },
    { title: 'Oportunidades', items: swot.opportunities, color: 'text-blue-600' },
    { title: 'Ameacas', items: swot.threats, color: 'text-orange-600' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Analise SWOT</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h3 className={`mb-2 font-semibold ${s.color}`}>{s.title}</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {s.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingCard({ pricing }: { pricing: Pricing }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Analise de Precos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Empresa
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Preco
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Periodo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Observacoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pricing.entries.map((entry, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{entry.company}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {entry.price} {entry.currency}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600">{entry.period}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{entry.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pricing.summary && (
        <p className="mt-4 text-sm text-gray-600">{pricing.summary}</p>
      )}
    </div>
  );
}

function FeaturesCard({ features }: { features: Features }) {
  const companies = Array.from(
    new Set(features.comparison.flatMap((c) => Object.keys(c.companies))),
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Comparativo de Features</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Feature
              </th>
              {companies.map((company) => (
                <th
                  key={company}
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {company}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.comparison.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.feature}</td>
                {companies.map((company) => (
                  <td key={company} className="px-4 py-2 text-sm text-gray-600">
                    {row.companies[company] ? (
                      <span className="text-green-600">Sim</span>
                    ) : (
                      <span className="text-gray-400">Nao</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {features.summary && (
        <p className="mt-4 text-sm text-gray-600">{features.summary}</p>
      )}
    </div>
  );
}

function ResearchDetailComponent() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useResearch(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center text-red-600">
        Erro ao carregar pesquisa
      </div>
    );
  }

  const report = data.report as {
    swot?: Swot;
    pricing?: Pricing;
    features?: Features;
    summary?: string;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.targetCompany}</h1>
          <p className="text-sm text-gray-500">
            Concorrentes: {data.competitors.join(', ')}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[data.status]}`}
        >
          {STATUS_LABELS[data.status] ?? data.status}
        </span>
      </div>

      {data.status !== 'completed' && data.status !== 'failed' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          A analise esta em andamento. A pagina sera atualizada automaticamente.
        </div>
      )}

      {data.status === 'failed' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Ocorreu uma falha durante a analise. Tente novamente mais tarde.
        </div>
      )}

      {report?.summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Resumo Executivo</h2>
          <p className="whitespace-pre-line text-gray-600">{report.summary}</p>
        </div>
      )}

      {report?.swot && <SwotCard swot={report.swot} />}
      {report?.pricing && <PricingCard pricing={report.pricing} />}
      {report?.features && <FeaturesCard features={report.features} />}
    </div>
  );
}
