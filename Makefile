.PHONY: help setup setup-env infra-up infra-down dev dev-back dev-front build typecheck test test-watch prod prod-down db-push db-studio db-migrate playwright clean reset

help: ## Mostra os comandos disponiveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Setup inicial completo do projeto
	@echo "Instalando dependencias..."
	pnpm install
	@echo "Copiando .env.example para .env..."
	cp -n .env.example .env 2>/dev/null || true
	@echo "Subindo Postgres + Redis..."
	docker compose up -d
	@echo ""
	@echo "Setup concluido!"
	@echo ""
	@echo "Proximos passos:"
	@echo "  1. Edite o arquivo .env com suas API keys"
	@echo "  2. Rode 'make db-push' para criar as tabelas"
	@echo "  3. Rode 'make playwright' para instalar o browser"
	@echo "  4. Rode 'make dev' para iniciar o projeto"

setup-env: ## Copia .env.example para .env se nao existir
	cp -n .env.example .env 2>/dev/null || echo ".env ja existe"

infra-up: ## Sobe Postgres + Redis local
	docker compose up -d

infra-down: ## Para Postgres + Redis local
	docker compose down

infra-logs: ## Mostra logs do Postgres + Redis
	docker compose logs -f

dev: ## Roda backend + frontend
	pnpm dev

dev-back: ## Roda so o backend (API + workers)
	pnpm dev:backend

dev-front: ## Roda so o frontend
	pnpm dev:frontend

build: ## Build todos os pacotes
	pnpm build

typecheck: ## TypeScript check
	pnpm typecheck

test: ## Roda todos os testes com Vitest
	pnpm test

test-watch: ## Roda testes em watch mode
	pnpm test:watch

playwright: ## Instala browsers do Playwright
	npx playwright install chromium

db-push: ## Sincroniza schema no banco (desenvolvimento)
	pnpm db:push

db-migrate: ## Roda migrations do Drizzle
	pnpm db:migrate

db-studio: ## Abre Drizzle Studio
	pnpm db:studio

db-reset: ## Reseta o banco de dados local (cuidado!)
	docker compose down -v
	docker compose up -d
	pnpm db:push

prod: ## Sobe stack de producao (docker compose)
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## Para stack de producao
	docker compose -f docker-compose.prod.yml down

clean: ## Limpa artefatos de build
	rm -rf packages/*/dist packages/*/node_modules node_modules .turbo

reset: clean ## Limpa tudo e sobe infra do zero
	docker compose down -v
	pnpm install
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d
	pnpm db:push
