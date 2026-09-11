#!/usr/bin/env bash
# Monitor de saúde da VPS (Tropa dos Dados)
# - Uso de disco
# - Validade do certificado Let's Encrypt
# - Serviços essenciais (nginx)
#
# Opcional: ALERT_WEBHOOK_URL para enviar um JSON em caso de alerta.
set -uo pipefail

DISK_PATH="${DISK_PATH:-/}"
DISK_WARN="${DISK_WARN:-80}"
DISK_CRIT="${DISK_CRIT:-90}"
CERT_WARN_DAYS="${CERT_WARN_DAYS:-20}"
CERT_CRIT_DAYS="${CERT_CRIT_DAYS:-7}"
LOG_FILE="${LOG_FILE:-/var/log/tropa-monitor.log}"
STATE_DIR="${STATE_DIR:-/var/lib/tropa-monitor}"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"

mkdir -p "$STATE_DIR"
STATUS_FILE="$STATE_DIR/status"
CRITICAL=0
WARN=0
LINES=()

log_line() {
  local level="$1"; shift
  local msg="$*"
  LINES+=("[$level] $msg")
  echo "$(date -Is) [$level] $msg" >> "$LOG_FILE"
}

# ---------- Disco ----------
DISK_USED="$(df -P "$DISK_PATH" | awk 'NR==2 {gsub("%","",$5); print $5}')"
DISK_FREE="$(df -h "$DISK_PATH" | awk 'NR==2 {print $4}')"
if [ -n "${DISK_USED:-}" ]; then
  if [ "$DISK_USED" -ge "$DISK_CRIT" ]; then
    CRITICAL=1
    log_line CRIT "Disco ${DISK_PATH} em ${DISK_USED}% (livre ${DISK_FREE}) — CRÍTICO (>= ${DISK_CRIT}%)"
  elif [ "$DISK_USED" -ge "$DISK_WARN" ]; then
    WARN=1
    log_line WARN "Disco ${DISK_PATH} em ${DISK_USED}% (livre ${DISK_FREE}) — atenção (>= ${DISK_WARN}%)"
  else
    log_line OK "Disco ${DISK_PATH} em ${DISK_USED}% (livre ${DISK_FREE})"
  fi
else
  WARN=1
  log_line WARN "Não foi possível ler o uso de disco de ${DISK_PATH}"
fi

# ---------- Certificado Let's Encrypt ----------
CERT_FOUND=0
if command -v certbot >/dev/null 2>&1; then
  while IFS= read -r expiry; do
    [ -z "$expiry" ] && continue
    CERT_FOUND=1
    exp_epoch="$(date -d "$expiry" +%s 2>/dev/null || echo 0)"
    [ "$exp_epoch" -eq 0 ] && continue
    days_left=$(( (exp_epoch - $(date +%s)) / 86400 ))
    if [ "$days_left" -le "$CERT_CRIT_DAYS" ]; then
      CRITICAL=1
      log_line CRIT "Certificado expira em ${days_left} dias (${expiry}) — renove já"
    elif [ "$days_left" -le "$CERT_WARN_DAYS" ]; then
      WARN=1
      log_line WARN "Certificado expira em ${days_left} dias (${expiry})"
    else
      log_line OK "Certificado válido por ${days_left} dias"
    fi
  done < <(certbot certificates 2>/dev/null | awk -F': ' '/Expiry Date/ {print $2}' | cut -d' ' -f1)
fi
if [ "$CERT_FOUND" -eq 0 ]; then
  WARN=1
  log_line WARN "Nenhum certificado encontrado / certbot indisponível"
fi

if systemctl is-active --quiet certbot.timer; then
  log_line OK "certbot.timer ativo (renovação automática)"
else
  CRITICAL=1
  log_line CRIT "certbot.timer NÃO está ativo — renovação automática parada"
fi

# ---------- Serviços ----------
for svc in nginx; do
  if systemctl is-active --quiet "$svc"; then
    log_line OK "serviço ${svc} ativo"
  else
    CRITICAL=1
    log_line CRIT "serviço ${svc} NÃO está ativo"
  fi
done

# ---------- Resultado ----------
OVERALL="ok"
[ "$WARN" -eq 1 ] && OVERALL="warn"
[ "$CRITICAL" -eq 1 ] && OVERALL="critical"

{
  echo "status=${OVERALL}"
  echo "checked_at=$(date -Is)"
  echo "disk_used_pct=${DISK_USED:-unknown}"
  echo "disk_free=${DISK_FREE:-unknown}"
} > "$STATUS_FILE"

# ---------- Alerta (opcional) ----------
if { [ "$CRITICAL" -eq 1 ] || [ "$WARN" -eq 1 ]; } && [ -n "$ALERT_WEBHOOK_URL" ]; then
  payload="$(printf '%s\n' "${LINES[@]}" | python3 -c 'import sys,json; print(json.dumps({"text": sys.stdin.read(), "status": sys.argv[1]}))' "$OVERALL" 2>/dev/null)"
  curl -fsS -m 15 -X POST -H 'Content-Type: application/json' -d "${payload:-{\"status\":\"$OVERALL\"}}" "$ALERT_WEBHOOK_URL" >/dev/null 2>&1 || \
    log_line WARN "Falha ao enviar alerta para o webhook"
fi

# Echo para o journal
printf '%s\n' "${LINES[@]}"

[ "$CRITICAL" -eq 1 ] && exit 2
[ "$WARN" -eq 1 ] && exit 1
exit 0
