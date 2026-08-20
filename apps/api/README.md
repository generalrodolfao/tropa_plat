# Tropa dos Dados — API

Backend da plataforma Tropa dos Dados. NestJS + Fastify + Prisma + PostgreSQL + Socket.IO.

## Stack

- **NestJS 11** com adapter **Fastify** (HTTP e Socket.IO)
- **Prisma** + **PostgreSQL 16**
- **Argon2id** para hash de senha
- **JWT** access (15m) + refresh opaco (30d) com rotação
- **Socket.IO** para realtime (namespace `/realtime`)
- **Swagger** em `/docs`

## Pré-requisitos

- Node 20+ (pnpm 11)
- Docker (para Postgres/Redis locais)

## Setup local

```bash
# 1. Suba Postgres e Redis
docker compose up -d

# 2. Instale dependências (na raiz do monorepo)
pnpm install

# 3. Configure o .env
cp .env.example .env

# 4. Rode as migrations
pnpm --filter @tropa/api db:deploy

# 5. (Opcional) Seed com dados demo
pnpm --filter @tropa/api db:seed

# 6. Rode a API
pnpm --filter @tropa/api dev
```

A API sobe em `http://localhost:4000/v1` e o Swagger em `http://localhost:4000/docs`.

### Usuário demo (após seed)

```
email:    demo@tropadosdados.com
password: tropa-demo-123
```

## Scripts

| Script           | Descrição                                   |
| ---------------- | ------------------------------------------- |
| `dev`            | Nest start em watch mode                    |
| `build`          | `nest build` (output em `dist/`)            |
| `start:prod`     | `node dist/main`                            |
| `lint`           | ESLint sobre `src/` e `test/`               |
| `typecheck`      | `tsc --noEmit`                              |
| `test:e2e`       | Testes de integração (Jest + supertest)     |
| `db:generate`    | Gera o Prisma Client                        |
| `db:deploy`      | Aplica migrations pendentes (`migrate deploy`) |
| `db:migrate`     | Cria/aplica migrations em dev (`migrate dev`)  |
| `db:seed`        | Roda o seed (`node .seed-dist/seed.js`)     |
| `db:seed:build`  | Compila o seed para JS (`tsc`)              |

## Módulos e rotas

Todos os endpoints são prefixados com `/v1`.

| Módulo      | Rotas principais                                                        |
| ----------- | ---------------------------------------------------------------------- |
| Auth        | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Health      | `GET /health`                                                           |
| Gamificação | `GET /gamification/summary`, `GET /gamification/ranks`                  |
| Conteúdo    | `GET /content/courses`, `GET /content/courses/:slug`, `GET /content/lessons/:id` |
| Progresso   | `POST /progress/start`, `POST /progress/complete`, `GET /progress/course/:courseId` |
| Ligas       | `GET /leagues/current`, `GET /leagues/history`                          |
| Biblioteca  | `GET /library`, `GET /library/ebooks/:slug`, `POST /library/progress`, `GET /library/certificates` |
| Hackathons  | `GET /hackathons`, `GET /hackathons/me`, `GET /hackathons/:id`, `POST /hackathons/join` |
| Vagas       | `GET /jobs`, `POST /jobs/apply`                                         |
| Realtime    | Socket.IO em `/realtime` (namespace)                                    |

## Banco de dados

O schema Prisma cobre:

- **Identidade**: users, profiles, roles, sessions (refresh tokens), organizations
- **Conteúdo**: courses, modules, lessons, lesson progress, quizzes (com IRT simplificado)
- **Gamificação**: xp, streak, badges, leagues/rankings
- **Produto**: sandboxes (SQL/Python), projetos, skills, PDI, CV
- **Mercado**: vagas + candidaturas, hackathons + times + submissions
- **Biblioteca**: ebooks + reading progress + certificados (horas complementares)
- **Auditoria**: audit log

Migrations ficam em `prisma/migrations/`. Para mudanças de schema em dev: `db:migrate`; em produção: `db:deploy`.

## Docker / Produção

O `Dockerfile` faz build multi-stage (deps → builder → runner). O `docker-entrypoint.sh` roda no boot:

1. `prisma migrate deploy` (idempotente, sempre)
2. `prisma db:seed` apenas se `SEED_ON_BOOT=true` (o seed é **destrutivo** — recria ligas/hackathons/vagas; use só na primeira subida)
3. Sobe a aplicação

### Deploy no Railway

Serviços: `web` (Next.js), `api` (este), `Postgres`, `Redis`.

Variáveis do serviço `api`:

| Variável            | Valor                                             |
| ------------------- | ------------------------------------------------- |
| `DATABASE_URL`      | `${{Postgres.DATABASE_URL}}`                      |
| `REDIS_URL`         | `${{Redis.REDIS_URL}}`                            |
| `JWT_ACCESS_SECRET` | segredo de acesso (troque em prod)                |
| `JWT_REFRESH_SECRET`| segredo de refresh (troque em prod)               |
| `JWT_ACCESS_TTL`    | `15m`                                             |
| `JWT_REFRESH_TTL`   | `30d`                                             |
| `CORS_ORIGIN`       | URL pública do `web`                              |
| `PORT`              | `4000`                                            |
| `RAILWAY_DOCKERFILE_PATH` | `apps/api/Dockerfile`                       |

Deploy:

```bash
railway up --ci --service api
```

## Testes

```bash
pnpm --filter @tropa/api test:e2e
```

O teste cobre o fluxo de auth ponta a ponta (register/login/me/refresh com rotação) usando supertest sobre o Fastify.