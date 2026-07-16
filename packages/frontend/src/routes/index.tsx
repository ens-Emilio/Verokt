import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useCreateResearch } from '../hooks/research';
import { createResearchSchema } from '@verokt/shared';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const createResearch = useCreateResearch();
  const [targetCompany, setTargetCompany] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const competitorsArray = competitors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const result = createResearchSchema.safeParse({
      targetCompany,
      competitors: competitorsArray,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados invalidos');
      return;
    }

    setError('');
    createResearch.mutate(result.data, {
      onSuccess: (data) => {
        navigate({ to: '/research/$id', params: { id: data.id } });
      },
    });
  };

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Pesquisador Autonomo
      </h1>
      <p className="mb-8 text-gray-600">
        Analise competitiva automatica com IA - SWOT, precos e posicionamento
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Empresa-alvo
          </label>
          <input
            type="text"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            placeholder="Ex: Nubank"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Concorrentes (separados por virgula)
          </label>
          <input
            type="text"
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            placeholder="Ex: Itau, Bradesco, Inter"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={createResearch.isPending}
          className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createResearch.isPending ? 'Iniciando...' : 'Analisar'}
        </button>
      </form>
    </div>
  );
}
