# Tropa dos Dados - Plataforma de Educação em Dados

## 🎯 Visão Geral

Plataforma completa de educação em dados com streaming de vídeos self-hosted, sistema de gamificação, hackathons, vagas de emprego e muito mais.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API           │    │   VPS           │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Nginx+FFmpeg)│
│   Railway       │    │   Railway       │    │   23.106.44.84  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                     │                     │
         │                     │                     │
         ▼                     ▼                     ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │  Vercel   │       │  Postgres │       │  Videos   │
   │  (Web)    │       │  Railway  │       │  (HLS)    │
   └───────────┘       └───────────┘       └───────────┘
```

## 🎬 Sistema de Streaming

### Configuração

- **VPS**: 23.106.44.84 (Ubuntu 24.04, 6 vCPU, 16GB RAM, 200GB NVMe)
- **Nginx**: Porta 8081 (HLS streaming)
- **API**: Porta 5000 (gestão de vídeos)
- **FFmpeg**: Conversão de vídeo para HLS

### URLs de Streaming

- **Base**: `http://23.106.44.84:8081`
- **Playlist HLS**: `http://23.106.44.84:8081/videos/{video_id}/playlist.m3u8`
- **Segmentos**: `http://23.106.44.84:8081/videos/{video_id}/segment_XXX.ts`

### Vídeos Disponíveis

| ID | Aula | Status |
|----|------|--------|
| ef1caee8 | Boas-vindas à Tropa (AWS Introdução) | ✅ Pronto |
| 14463be3 | 2025-12 - CI-CD — Aula 01 | ✅ Pronto |
| c00101ce | 2026-07 - Missão Blindagem — Aula 01 | ✅ Pronto |

### Como Adicionar Novos Vídeos

1. **Upload via API**:
   ```bash
   curl -X POST http://23.106.44.84:5000/api/videos/upload \
     -F "file=@video.mp4" \
     -F "lesson_id=LESSON_ID"
   ```

2. **Conversão automática**:
   - O FFmpeg converte automaticamente para HLS
   - Gera playlist.m3u8 e segmentos .ts
   - Atualiza o banco de dados

3. **Integração com a plataforma**:
   - Atualizar o campo `content.videoUrl` da aula
   - O VideoPlayer.js detecta automaticamente a URL

## 🚀 Deploy

### Railway (Frontend + API)

```bash
# Deploy frontend
railway link -p a74eef13-363b-4185-b547-e9335d46bd65 -s web
railway up

# Deploy API
railway link -p a74eef13-363b-4185-b547-e9335d46bd65 -s api
railway up
```

### VPS (Streaming)

```bash
# Conectar na VPS
ssh root@23.106.44.84

# Verificar serviços
systemctl status nginx
systemctl status video-api

# Processar vídeos
/tmp/pv.sh
```

## 📁 Estrutura do Projeto

```
tropa_plat/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── ai/            # Módulo de IA
│   │   │   ├── b2b/           # Dashboard B2B
│   │   │   ├── certificates/  # Certificados
│   │   │   ├── content/       # Gestão de conteúdo
│   │   │   ├── notifications/ # Notificações
│   │   │   ├── payments/      # Pagamentos
│   │   │   ├── pdi/           # Plano de Desenvolvimento
│   │   │   ├── projects/      # Projetos
│   │   │   ├── quizzes/       # Quizzes
│   │   │   └── video/         # Gestão de vídeos
│   │   └── prisma/
│   │       └── schema.prisma  # Schema do banco
│   └── web/                   # Frontend Next.js
│       ├── app/
│       │   ├── admin/         # Painel admin
│       │   └── app/           # Área do aluno
│       └── components/
│           ├── onboarding/    # Wizard de onboarding
│           ├── sandbox/       # Editor de código
│           └── video-player.js # Player de vídeo
├── scripts/
│   ├── process-videos.sh      # Processar vídeos
│   ├── sync-videos.py         # Sincronizar com Drive
│   └── video-api.py           # API de gestão
└── specs/
    └── 00-master-spec.md      # Especificações
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# API
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Cloudflare (opcional)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_STREAM_TOKEN=...

# VPS Streaming
VPS_IP=23.106.44.84
STREAM_PORT=8081
```

### Railway

```toml
# apps/api/railway.toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "npx prisma db push --accept-data-loss && node dist/main.js"
```

## 📊 Métricas

- **32 cursos** importados do Google Drive
- **192 aulas** (2 módulos × 3 aulas × 32 cursos)
- **3 vídeos** processados e disponíveis
- **75 IDs** de vídeos no sistema

## 🔐 Segurança

- **JWT**: Autenticação com access/refresh tokens
- **Roles**: Controle de acesso por função (admin, student)
- **CORS**: Configurado para produção
- **Firewall**: UFW configurado na VPS

## 🎯 Próximos Passos

1. **Processar mais vídeos**: Rodar script de processamento
2. **Configurar domínio**: Apontar domínio para a VPS
3. **SSL/TLS**: Configurar HTTPS com Let's Encrypt
4. **Backup**: Configurar backup automático
5. **Monitoramento**: Configurar logs e métricas

## 📞 Contato

- **Email**: admin@tropadosdados.com
- **GitHub**: [Repositório](https://github.com/seu-usuario/tropa_plat)

---

**Última atualização**: 2026-09-05
