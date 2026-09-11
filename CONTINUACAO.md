# Continuacao do Projeto - Guia de Operacao

> **Status:** Streaming de videos self-hosted funcional com HTTPS.
>
> **Ultima atualizacao:** 2026-09-11

---

## 📋 Resumo do que foi feito

### Infraestrutura de Streaming (VPS)
Streaming de video self-hosted usando **Nginx + FFmpeg** na VPS:

- **VPS:** `23.106.44.84` (Ubuntu 24.04, 6 vCPU, 16GB RAM, 200GB NVMe)
- **Nginx:** porta `8081` servindo HLS **via HTTPS (Let's Encrypt)**
- **FFmpeg:** conversao de videos para HLS

**URLs base:**
- Streaming (HTTPS): `https://23.106.44.84.nip.io:8081`
- Playlist HLS: `https://23.106.44.84.nip.io:8081/videos/{id}/playlist.m3u8`
- Segmentos: `https://23.106.44.84.nip.io:8081/videos/{id}/segment_XXX.ts`

> ⚠️ Use sempre o hostname `23.106.44.84.nip.io` nas URLs. O IP cru (`https://23.106.44.84:8081`) **nao funciona** porque o certificado TLS nao cobre o IP.

### Videos processados
- **26 playlists HLS** servidas em `/var/www/videos` (23 recordings do Black Ops + 3 antigos)
- **24 aulas** vinculadas no Railway com `content.streamUrl` apontando para `https://23.106.44.84.nip.io:8081`

### Banco (Railway)
- 34 cursos, 203 aulas no catalogo
- `content.streamUrl` preenchido em todas as 24 aulas com video

---

## 🔐 HTTPS / Certificado

- Certificado Let's Encrypt: **`23.106.44.84.nip.io`** (expira **2026-11-29**)
- Renovacao automatica via `certbot.timer` + deploy hook `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx`
- Config nginx: `/etc/nginx/sites-available/videos-ssl`
- Verificar renovacao: `certbot certificates` | status do timer: `systemctl status certbot.timer`

---

## 🚀 Como continuar do outro computador

### 1. Conectar na VPS
```bash
ssh root@23.106.44.84      # via chave SSH (~/.ssh/id_ed25519)
```

### 2. Verificar servicos ativos
```bash
systemctl status nginx
curl https://23.106.44.84.nip.io:8081/   # deve responder
```

### 3. Processar novos videos
Pipeline de processamento: `/root/process_all.py` na VPS (download via rclone do Drive, conversao HLS com ffmpeg, resultado em `/var/www/videos/process_results.json`).

Passo a passo manual (um por um para nao estourar disco):
```bash
# 1. Baixar um recording do Drive (rclone configurado na VPS)
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
curl "https://23.106.44.84.nip.io:8081/videos/$VID/playlist.m3u8"
```

### 4. Atualizar o banco (Railway) com a URL do video
```bash
# Obter token (credenciais admin em cofre de senhas, NUNCA no repo)
TOKEN=$(curl -s -X POST "https://api-production-28e6.up.railway.app/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Atualizar aula
curl -s -X PATCH "https://api-production-28e6.up.railway.app/v1/admin/content/lessons/<LESSON_ID>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hasVideo":true,"videoUid":"VID","streamUrl":"https://23.106.44.84.nip.io:8081/videos/VID/playlist.m3u8"}}'
```

---

## 🗄️ Segredos (NUNCA commitar)

Credenciais reais (senha root da VPS, DATABASE_URL de producao, token Cloudflare,
senha do admin) ficam apenas em cofre de senhas / variaveis de ambiente, **fora do git**.

| Recurso | Valor (referencia) |
|---------|-------|
| VPS IP | `23.106.44.84` (acesso via chave SSH) |
| Stream host HTTPS | `23.106.44.84.nip.io:8081` |
| Cloudflare Account ID | via env `CLOUDFLARE_ACCOUNT_ID` |
| Cloudflare API Token | via env `CLOUDFLARE_API_TOKEN` |
| Railway API | `https://api-production-28e6.up.railway.app` |
| DB URL | via env `DATABASE_URL` no Railway |

---

## 🎬 Frontend (players de video)

O player usa HLS.js e funciona com as URLs self-hosted. A pagina de aula
(`app/app/trilhas/[slug]/[lesson]/page.tsx`) busca o video em `content.streamUrl`
ou `content.videoUrl`.

**Configuracao `.env.example` (web):**
```
NEXT_PUBLIC_API_URL=https://api-production-28e6.up.railway.app
```

---

## 🔧 Servicos na VPS (reiniciar se precisar)

```bash
# Nginx (streaming)
systemctl restart nginx

# Logs
tail -f /var/log/nginx/error.log
journalctl -u nginx -n 50
```

---

## ✅ Checklist para finalizar

- [x] Processar os 23 recordings restantes (HLS na VPS)
- [x] Atualizar cada aula no Railway com `content.streamUrl` (24 aulas)
- [x] HTTPS configurado (Let's Encrypt via nip.io) e URLs atualizadas no banco
- [ ] Pendente (sem custo): backup diario do Postgres, monitoramento (disco/cert), CI verde
- [ ] Pendente (requer investimento): dominio proprio, plano Cloudflare Stream, billing GitHub