#!/bin/sh
# Tropa dos Dados — API entrypoint
# Roda migrations (idempotente) no boot e, se SEED_ON_BOOT=true, roda o seed.
set -e

cd apps/api

echo "[entrypoint] Rodando migrations..."
pnpm --filter @tropa/api db:deploy

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "[entrypoint] SEED_ON_BOOT=true — rodando seed..."
  pnpm --filter @tropa/api db:seed
else
  echo "[entrypoint] Seed ignorado (SEED_ON_BOOT não é true)."
fi

echo "[entrypoint] Iniciando API..."
cd /app
exec node apps/api/dist/main.js