#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/ens-Emilio/Verokt.git"
PROJECT_NAME="Verokt"

print_step() {
  echo ""
  echo "================================================"
  echo "  $1"
  echo "================================================"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ Erro: $1 nao encontrado."
    echo "$2"
    exit 1
  fi
}

print_step "Verificando prerequisitos"

check_command "node" "Instale o Node.js >= 20: https://nodejs.org/"
check_command "pnpm" "Instale o pnpm >= 9: https://pnpm.io/installation"
check_command "docker" "Instale o Docker: https://docs.docker.com/get-docker/"
check_command "git" "Instale o Git: https://git-scm.com/"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Erro: Node.js deve ser >= 20. Versao atual: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ pnpm $(pnpm -v)"

print_step "Clonando repositorio"

if [ ! -d "$PROJECT_NAME" ]; then
  git clone "$REPO_URL" "$PROJECT_NAME"
fi

cd "$PROJECT_NAME"

print_step "Instalando dependencias"

pnpm install

print_step "Configurando variaveis de ambiente"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Arquivo .env criado a partir de .env.example"
else
  echo "✅ Arquivo .env ja existe"
fi

print_step "Subindo Postgres + Redis"

docker compose up -d

print_step "Criando tabelas e indices vetoriais"

pnpm db:push

print_step "Instalando browser do Playwright"

npx playwright install chromium

print_step "Setup concluido!"

echo ""
echo "Proximos passos:"
echo ""
echo "  1. Edite o arquivo .env com suas API keys:"
echo "     - OPENAI_API_KEY"
echo "     - COMPATIBLE_BASE_URL + COMPATIBLE_API_KEY + COMPATIBLE_MODEL"
echo "     - NATIVE_API_KEY + NATIVE_MODEL"
echo "     - JWT_SECRET (qualquer string)"
echo ""
echo "  2. Rode o projeto:"
echo "     pnpm dev"
echo ""
echo "  Acesse:"
echo "     Frontend: http://localhost:5173"
echo "     API:      http://localhost:3000"
echo ""
