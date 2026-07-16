# Contribuindo para o Verokt

Obrigado pelo interesse em contribuir! Este documento descreve o processo para colaborar com o projeto.

## Requisitos

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose
- Contas/API keys em:
  - OpenAI (embeddings)
  - Provider OpenAI-compatible (DeepSeek, Groq, Ollama...)
  - Provider nativo (Anthropic, OpenRouter...)

## Setup de Desenvolvimento Local

### 1. Clone e instale dependencias

```bash
git clone https://github.com/seu-usuario/verokt.git
cd verokt
pnpm install
```

### 2. Configure as variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves. Veja o README para instrucoes detalhadas de onde pegar cada key.

### 3. Suba a infraestrutura local

```bash
docker compose up -d
```

Isso sobe:
- PostgreSQL 17 com pgvector na porta 5432
- Redis na porta 6379

### 4. Crie as tabelas e indices vetoriais

```bash
pnpm db:push
```

### 5. Instale os browsers do Playwright

```bash
npx playwright install chromium
```

### 6. Rode o projeto

```bash
pnpm dev
```

Acesse http://localhost:5173. A API roda em http://localhost:3000.

## Estrutura do Projeto

O projeto e um monorepo pnpm com 3 pacotes:

- `packages/shared` - Schemas Zod, tipos e constantes compartilhados entre frontend e backend
- `packages/backend` - API Hono + workers BullMQ + Drizzle ORM + TanStack AI
- `packages/frontend` - Vite + React + TanStack Router/Query

### Arquitetura

```
Frontend (React + TanStack)
   |
   v
API (Hono + Zod) -> valida -> cria research -> enfileira job BullMQ
   |
   v
Workers (BullMQ)
   |
   +-- Scraper (Playwright + busca web)
   +-- Indexer (OpenAI embeddings + pgvector)
   +-- Analyzer (TanStack AI + SWOT/pricing/features/summary)
   |
   v
PostgreSQL (pgvector)
```

## Comandos Uteis

```bash
# Roda tudo (frontend + backend + workers)
pnpm dev

# So o backend
pnpm dev:backend

# So o frontend
pnpm dev:frontend

# TypeScript check em todos os pacotes
pnpm typecheck

# Build de producao
pnpm build

# Cria/atualiza tabelas
pnpm db:push

# GUI do banco
pnpm db:studio

# Rodar testes
pnpm test

# Rodar testes em watch mode
pnpm test:watch

# Ver comandos disponiveis
make help
```

## Padroes de Codigo

- Use TypeScript em modo strict
- Valide dados com Zod (schemas devem ficar no pacote `shared`)
- Siga a arquitetura hexagonal: API -> Workers -> DB
- Preferencia por funcoes puras e injecao de dependencias
- Evite comentarios obvios; comente apenas logica complexa
- Mantenha os schemas Zod como fonte unica da verdade

## Trabalhando nos Workers

Os workers estao em `packages/backend/src/workers/`:

- `scraper.ts` - busca sites e extrai conteudo com Playwright
- `indexer.ts` - gera embeddings dos documentos
- `analyzer.ts` - gera o relatorio com IA

Para testar um worker isoladamente, voce pode enfileirar um job manualmente:

```typescript
import { addScrapeJob } from './packages/backend/src/queues/research.queue.js';

await addScrapeJob({
  researchId: 'seu-research-id',
  targetCompany: 'Nubank',
  competitors: ['Itau', 'Bradesco'],
});
```

## Testes

Use Vitest para escrever testes:

```bash
pnpm test        # roda todos os testes
pnpm test:watch  # modo watch
```

Diretorios de teste:
- `packages/backend/src/**/*.test.ts`
- `packages/shared/src/**/*.test.ts`

### Dicas para testes

- Mocks: use `vi.fn()` para mocks e `vi.mock()` para modulos
- Banco: prefira testes unitarios sem banco; para testes de integracao, suba Postgres/Redis local
- IA: sempre faca mock dos adapters de IA nos testes para nao consumir tokens

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona extracao de precos no analyzer
fix: corrige polling do status no frontend
refactor: extrai config de providers para arquivo separado
docs: atualiza README com instrucoes de deploy
test: adiciona testes para o scraper
```

## Antes de abrir um PR

```bash
pnpm typecheck   # deve passar sem erros
pnpm build       # deve compilar sem erros
pnpm test        # todos os testes devem passar
```

## Reportando Bugs

Abra uma issue com:
- Descricao clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Logs relevantes
- Variaveis de ambiente (sem expor secrets)

## Perguntas?

Entre em contato abrindo uma issue ou discussion no GitHub.
