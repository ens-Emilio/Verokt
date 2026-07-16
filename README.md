# Verokt

Pesquisador Autonomo - Analise competitiva com IA para RFPs e concorrencias.

Insira uma empresa-alvo e seus concorrentes. O sistema orquestra agentes de scraping, busca vetorial (RAG) e LLMs para gerar um relatorio executivo com SWOT, analise de precos e posicionamento de features.

## Features

- **Scraping inteligente** - Playwright encontra sites oficiais, paginas de precos e blogs
- **RAG com pgvector** - Indexacao semantica de documentos raspados
- **Analise com IA** - TanStack AI gera SWOT estruturado via output estruturado
- **Multi-provider** - OpenAI-compatible (DeepSeek, Groq, Ollama) + provider nativo (Anthropic)
- **Tempo real** - SSE + TanStack Query com polling automatico
- **Open source** - MIT, roda local ou em VPS

## Tech Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + TanStack Router/Query/Table/Form |
| API | Hono + Zod + Server-Sent Events |
| Workers | BullMQ + Redis |
| IA | TanStack AI + @tanstack/ai-openai (compatible) + @tanstack/ai-anthropic |
| Banco | PostgreSQL (pgvector) + Drizzle ORM |
| Monorepo | pnpm workspaces + Turborepo |

## Prerequisitos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Chaves de API para:
  - OpenAI (embeddings)
  - Um provider OpenAI-compatible (DeepSeek, Groq, Ollama...) para tarefas simples
  - Um provider nativo (Anthropic, OpenRouter...) para tarefas complexas

## Quick Start (Local)

A forma mais rapida de rodar o projeto localmente e com o script automatico:

```bash
# 1. Baixe e execute o script de setup
curl -fsSL https://raw.githubusercontent.com/ens-Emilio/Verokt/main/scripts/setup-local.sh | bash

# 2. Entre na pasta
cd Verokt

# 3. Edite .env com suas API keys
# Veja a secao "Obtendo API Keys" abaixo

# 4. Verifique se as envs estao OK
./scripts/check-env.sh

# 5. Rode o projeto
pnpm dev
```

Ou, se preferir fazer manualmente:

```bash
# 1. Clone
git clone https://github.com/ens-Emilio/Verokt.git
cd Verokt

# 2. Instale dependencias
pnpm install

# 3. Configure variaveis de ambiente
cp .env.example .env
# Edite .env com suas API keys (veja secao "Obtendo API Keys" abaixo)

# 4. Suba Postgres + Redis
docker compose up -d

# 5. Crie as tabelas e indices vetoriais
pnpm db:push

# 6. Instale browsers do Playwright
npx playwright install chromium

# 7. Rode o projeto
pnpm dev
```

Acesse:
- Frontend: http://localhost:5173
- API: http://localhost:3000
- Health check: http://localhost:3000/health

## Setup com Make (alternativa)

Se preferir, use os comandos do Makefile:

```bash
make setup    # instala deps, copia .env, sobe Postgres/Redis
make db-push  # cria tabelas
make dev      # roda API + workers + frontend
```

Veja todos os comandos:

```bash
make help
```

## Obtendo API Keys

### 1. OpenAI (obrigatorio para embeddings)

1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Cole em `OPENAI_API_KEY` no `.env`

> Nao e necessario ter credito pago para testar, mas e necessario para embeddings em producao. Voce tambem pode usar outro servico compativel com a API de embeddings da OpenAI (Groq, etc.) ajustando `OPENAI_API_KEY` e `OPENAI_EMBEDDING_MODEL`.

### 2. Provider OpenAI-Compatible (tarefas simples: scraping, pricing)

Opcoes:

**DeepSeek**
- https://platform.deepseek.com/api_keys
- `COMPATIBLE_BASE_URL=https://api.deepseek.com/v1`
- `COMPATIBLE_MODEL=deepseek-chat`

**Groq**
- https://console.groq.com/keys
- `COMPATIBLE_BASE_URL=https://api.groq.com/openai/v1`
- `COMPATIBLE_MODEL=llama-3.3-70b-versatile`

**Ollama (local)**
- Instale o Ollama: https://ollama.com
- Rode um modelo: `ollama run llama3.2`
- `COMPATIBLE_BASE_URL=http://localhost:11434/v1`
- `COMPATIBLE_MODEL=llama3.2`

### 3. Provider Nativo (tarefas complexas: SWOT, summary)

**Anthropic (recomendado)**
- https://console.anthropic.com/settings/keys
- `NATIVE_PROVIDER=anthropic`
- `NATIVE_MODEL=claude-sonnet-4-20250514`

**OpenRouter**
- https://openrouter.ai/keys
- Requer ajustar o adapter no backend para usar `@tanstack/ai-openrouter`
- `NATIVE_PROVIDER=openrouter`
- `NATIVE_MODEL=openai/gpt-4o`

> O projeto usa Anthropic por padrao. Para usar outro provider nativo, edite `packages/backend/src/config/ai-providers.ts`.

### 4. JWT Secret (local)

Para desenvolvimento local, qualquer string serve:

```env
JWT_SECRET=qualquer-string-secreta-aqui
```

Em producao, use uma string aleatoria longa.

## Variaveis de Ambiente

| Variavel | Descricao | Obrigatorio |
|---|---|---|
| `DATABASE_URL` | URL do PostgreSQL | Sim |
| `REDIS_URL` | URL do Redis | Sim |
| `BACKEND_PORT` | Porta da API | Nao (3000) |
| `OPENAI_API_KEY` | Key da OpenAI (para embeddings) | Sim |
| `OPENAI_EMBEDDING_MODEL` | Modelo de embedding | Nao (text-embedding-3-small) |
| `COMPATIBLE_PROVIDER_NAME` | Nome do provider compatible | Nao |
| `COMPATIBLE_BASE_URL` | URL base do provider compatible | Sim |
| `COMPATIBLE_API_KEY` | API key do provider compatible | Sim |
| `COMPATIBLE_MODELS` | Lista de modelos (separados por virgula) | Nao |
| `COMPATIBLE_MODEL` | Modelo padrao do compatible | Sim |
| `NATIVE_PROVIDER` | Provider nativo (anthropic, openrouter, etc.) | Nao (anthropic) |
| `NATIVE_API_KEY` | API key do provider nativo | Sim |
| `NATIVE_MODEL` | Modelo do provider nativo | Sim |
| `JWT_SECRET` | Secret do JWT | Sim (em producao) |

### Providers suportados

**OpenAI-compatible:** DeepSeek, Groq, Ollama, LM Studio, vLLM, etc.

**Nativos:** Anthropic (Claude), OpenRouter, Google Gemini, Ollama, Groq, xAI Grok, Amazon Bedrock, fal

## Estrutura do Projeto

```
verokt/
├── packages/
│   ├── shared/           # Zod schemas, tipos, constantes
│   ├── backend/          # Hono API + BullMQ workers + TanStack AI
│   │   └── src/
│   │       ├── api/      # Rotas HTTP
│   │       ├── workers/  # Scraper, Indexer, Analyzer
│   │       ├── config/   # Env validation + AI providers
│   │       ├── db/       # Drizzle schema + client
│   │       ├── queues/   # BullMQ config
│   │       └── lib/      # Embeddings, vector-search, Playwright, search
│   └── frontend/         # Vite + React + TanStack
│       └── src/
│           ├── routes/   # TanStack Router (file-based)
│           ├── hooks/    # TanStack Query
│           └── lib/      # API client
├── docker-compose.yml         # Dev: Postgres + Redis
├── docker-compose.prod.yml    # Prod: full stack
├── Dockerfile                 # Multi-stage (backend + frontend)
└── turbo.json
```

## Scripts

```bash
pnpm dev           # API + workers + frontend
pnpm dev:backend   # So backend
pnpm dev:frontend  # So frontend
pnpm build         # Build todos os pacotes
pnpm typecheck     # TypeScript check
pnpm db:push        # Sincronizar schema no banco
pnpm db:studio      # Drizzle Studio (GUI do banco)
pnpm test           # Rodar testes com Vitest
```

## Fluxo de Execucao

```
Usuario -> POST /api/research
  -> Cria registro no Postgres
  -> Enfileira job no BullMQ

Worker 1 (Scraper)
  -> Busca sites no DuckDuckGo e URLs canonicas
  -> Playwright raspa site, precos, blog
  -> Salva documentos no Postgres

Worker 2 (Indexer)
  -> Gera embeddings (OpenAI text-embedding-3-small)
  -> Salva vetores no pgvector

Worker 3 (Analyzer)
  -> Busca vetorial por similaridade
  -> TanStack AI chat() com outputSchema (SWOT, pricing, features)
  -> Gera resumo executivo
  -> Salva relatorio no Postgres

Frontend
  -> TanStack Query faz polling do status
  -> Exibe SWOT + precos + features quando pronto
```

## Testes

O projeto inclui testes basicos com Vitest:

```bash
pnpm test
```

Para mais detalhes, veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Contribuindo

Contribuicoes sao bem-vindas! Veja [CONTRIBUTING.md](./CONTRIBUTING.md).

## Licenca

[MIT](./LICENSE)
