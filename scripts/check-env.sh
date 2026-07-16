#!/usr/bin/env bash
set -e

if [ ! -f ".env" ]; then
  echo "❌ Arquivo .env nao encontrado. Rode: cp .env.example .env"
  exit 1
fi

REQUIRED_VARS=(
  "OPENAI_API_KEY"
  "COMPATIBLE_BASE_URL"
  "COMPATIBLE_API_KEY"
  "COMPATIBLE_MODEL"
  "NATIVE_API_KEY"
  "NATIVE_MODEL"
  "JWT_SECRET"
)

MISSING=0

for VAR in "${REQUIRED_VARS[@]}"; do
  VALUE=$(grep "^${VAR}=" .env | cut -d'=' -f2- | tr -d '"' | xargs)
  if [ -z "$VALUE" ] || [ "$VALUE" = "..." ] || [ "$VALUE" = "sk-..." ] || [ "$VALUE" = "sk-ant-..." ] || [ "$VALUE" = "yolo_..." ]; then
    echo "❌ $VAR nao configurado"
    MISSING=$((MISSING + 1))
  else
    echo "✅ $VAR configurado"
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "Preencha as variaveis acima no arquivo .env antes de rodar o projeto."
  exit 1
fi

echo ""
echo "Todas as variaveis obrigatorias estao configuradas."
