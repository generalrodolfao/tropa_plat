# Continuacao do Projeto - Guia de Operacao

> **Status:** Em andamento - Streaming de videos self-hosted parcialmente funcional.
>
> **Ultima atualizacao:** 2026-09-09

---

## 📋 Resumo do que foi feito

### Infraestrutura de Streaming (VPS)
Criamos um servico de streaming de video self-hosted usando **Nginx + FFmpeg** na VPS:

- **VPS:** `23.106.44.84` (Ubuntu 24.04, 6 vCPU, 16GB RAM, 200GB NVMe)
- **Nginx:** porta `8081` servindo HLS
- **API de gestao:** porta `5000` (Flask, `video-api.py`)
- **FFmpeg:** conversao de videos para HLS

**URLs base:**
- Streaming: `http://23.106.44.84:8081`
- API: `http://23.106.44.84:5000`
- Playlist HLS: `http://23.106.44.84:8081/videos/{id}/playlist.m3u8`

### Videos processados (HLS prontos)
| ID | Aula | Status |
|----|------|--------|
| `ef1caee8` | Boas-vindas a Tropa | ✅ Pronto |
| `14463be3` | 2025-12 - CI-CD | ✅ Pronto |
| `c00101ce` | 2026-07 - Missao Blindagem | ✅ Pronto |

### Drive / Fonte dos videos
- **Pasta principal:** `1KF3zRnq8Q-WuwwZEMLJhY-s5meTGy3Wk`
- **Pasta Black Ops:** `1_vCMYQjWjGWYFNTmw_Ds2etaIWkDquR-`
- **24 recordings** no total (~24GB), apenas 3 processados ate agora

---

## ⚠️ PONTO CRITICO - Cloudflare Stream

O [Cloudflare Stream](https://dash.cloudflare.com → Stream) **retornou erro de cota**:

```
Storage capacity exceeded: You have uploaded 0.00 minutes and are allocated 0 minutes.
```

**O plano Stream nao tem minutos alocados.** Por isso migramos para o streaming self-hosted na VPS.

**Para desbloquear a opcao Cloudflare Stream** (se preferir): comprar minutos em
`dash.cloudflare.com → Stream → Billing`. Custo: ~$5/mes por 1.000 min armazenamento.

**Decisao atual:** continuar com **self-hosted na VPS** (Nginx + HLS). Ja funciona.

---

## 🚀 Como continuar do outro computador

### 1. Conectar na VPS
```bash
ssh root@23.106.44.84
# senha: REMOVED_SECRET
```

### 2. Verificar servicos ativos
```bash
systemctl status nginx
systemctl status video-api
curl http://localhost:8081/health   # deve retornar OK
```

### 3. Baixar e processar os 21 videos restantes
O script de processamento esta em `/tmp/process-videos.sh` na VPS OU no repo em `scripts/process-videos.sh`.

**Passo a passo manual (um por um para nao estourar disco):**
```bash
# 1. Baixar um recording do Drive (rclone ja configurado na VPS)
rclone copy "gdrive:Black Ops (2025-2026)/<PASTA>" /var/www/videos/raw/ \
  --drive-root-folder-id 1_vCMYQjWjGWYFNTmw_Ds2etaIWkDquR- \
  --include '*Recording*'

# 2. Gerar ID unico (md5 do nome)
VID=$(echo "<NOME>" | md5sum | cut -c1-8)

# 3. Converter para HLS
ffmpeg -i "/var/www/videos/raw/<ARQUIVO>" \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "/var/www/videos/$VID/seg_%03d.ts" \
  "/var/www/videos/$VID/playlist.m3u8" -y

# 4. Testar
curl "http://localhost:8081/videos/$VID/playlist.m3u8"
```

### 4. Atualizar o banco (Railway) com a URL do video
```bash
# Obter token
TOKEN=$(curl -s -X POST "https://api-production-28e6.up.railway.app/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tropadosdados.com","password":"REMOVED_SECRET"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Atualizar aula
curl -s -X PATCH "https://api-production-28e6.up.railway.app/v1/admin/content/lessons/<LESSON_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hasVideo":true,"videoUid":"VID","streamUrl":"http://23.106.44.84:8081/videos/VID/playlist.m3u8"}}'
```

---

## 🗄️ Credenciais (guardar em segredo, NUNCA commitar)

| Recurso | Valor |
|---------|-------|
| VPS IP | `23.106.44.84` |
| VPS user | `root` |
| VPS senha | `REMOVED_SECRET` |
| Cloudflare Account ID | `REMOVED_ACCOUNT_ID` |
| Cloudflare API Token | `cfut_...` (usar var de ambiente `CLOUDFLARE_API_TOKEN`) |
| Railway API | `https://api-production-28e6.up.railway.app` |
| DB URL | `postgresql://postgres:REMOVED_SECRET@postgres-production-8d52.up.railway.app:5432/railway` |

---

## 🎬 Frontend (players de video)

O player ja usa HLS.js e funciona com as URLs self-hosted. A pagina de aula
(`app/app/trilhas/[slug]/[lesson]/page.tsx`) busca o video em `content.streamUrl`
ou `content.videoUrl`, com fallback para a API de video.

**Configuracao `.env.example` (web):**
```
NEXT_PUBLIC_API_URL=https://api-production-28e6.up.railway.app
```

---

## 🔧 Servicos na VPS (reiniciar se precisar)

```bash
# Nginx (streaming)
systemctl restart nginx

# API de video (Flask)
systemctl restart video-api

# Logs
journalctl -u video-api -n 50
tail -f /var/log/nginx/error.log
```

---

## ✅ Checklist para finalizar

- [ ] Processar os 21 recordings restantes (HLS na VPS)
- [ ] Atualizar cada aula no Railway com `content.streamUrl`
- [ ] Testar playback no frontend (player HLS.js)
- [ ] Fluxo: VPS pode ser acessada externamente na porta 8081 (firewall UFW ok)
- [ ] `setup_vps.sh` e `vps_migration.py` prontos como referencia (requerem rclone + Google Drive auth)
