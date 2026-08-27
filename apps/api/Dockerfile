# Tropa dos Dados — API (NestJS + Prisma)
# Multi-stage: dependências → build → runtime enxuto

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json .npmrc pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @tropa/api... --frozen-lockfile

FROM deps AS builder
COPY apps/api apps/api
RUN pnpm --filter @tropa/api db:generate && pnpm --filter @tropa/api db:seed:build && pnpm --filter @tropa/api db:seed:drive:build && pnpm --filter @tropa/api build

FROM base AS runner
ENV NODE_ENV=production
COPY package.json pnpm-workspace.yaml .npmrc pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @tropa/api... --prod --frozen-lockfile
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/.seed-dist apps/api/.seed-dist
COPY --from=builder /app/apps/api/node_modules apps/api/node_modules
RUN pnpm --filter @tropa/api db:generate

EXPOSE 4000
COPY apps/api/docker-entrypoint.sh docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
CMD ["sh", "docker-entrypoint.sh"]