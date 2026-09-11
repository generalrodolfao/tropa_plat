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

- **Base (HTTPS)**: `https://23.106.44.84.nip.io:8081`
- **Playlist HLS**: `https://23.106.44.84.nip.io:8081/videos/{video_id}/playlist.m3u8`
- **Segmentos**: `https://23.106.44.84.nip.io:8081/videos/{video_id}/segment_XXX.ts`

> ⚠️ Use sempre o hostname `23.106.44.84.nip.io` (certificado Let's Encrypt cobre
> o hostname, nao o IP). Renovacao automatica via `certbot.timer`.

### Vídeos Disponíveis

Status atual: **24 aulas** vinculadas no Railway com `content.streamUrl` HTTPS.
Lista completa de playlists HLS em `/var/www/videos/process_results.json` na VPS.

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
railway up --project tropa-dos-dados --environment production --service web

# Deploy API
railway up --project tropa-dos-dados --environment production --service api
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

- **34 cursos** no catálogo (Railway)
- **203 aulas** (Railway)
- **24 aulas** com vídeo HLS vinculado (streamUrl HTTPS)
- **26 playlists** HLS servidas na VPS

## 🔐 Segurança

- **JWT**: Autenticação com access/refresh tokens
- **Roles**: Controle de acesso por função (admin, student)
- **CORS**: Configurado para produção
- **TLS**: HTTPS na porta 8081 (Let's Encrypt, hostname nip.io)
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
