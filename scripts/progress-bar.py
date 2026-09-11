#!/usr/bin/env python3
"""Barra de progresso do processamento de vídeos (consulta a VPS via SSH)."""
import subprocess, sys, time, json, os, re

VPS = "root@23.106.44.84"
KEY = os.path.expanduser("~/.ssh/id_ed25519")
TOTAL = 23  # recordings na fila do pipeline
VPS_URL = "http://23.106.44.84:8081"

def ssh(cmd):
    r = subprocess.run(
        ["ssh", "-i", KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", VPS, cmd],
        capture_output=True, text=True, timeout=30,
    )
    return r.stdout.strip()

def fetch():
    out = {
        "done": 0, "failed": 0, "current": None, "playlists": 0,
        "disk_used": None, "disk_avail": None, "raw_size": None, "proc_alive": False,
        "ffmpeg": None, "last_update": None,
    }
    res = ssh('python3 -c "import json;d=json.load(open(\'/var/www/videos/process_results.json\'));print(sum(1 for v in d.values() if v[\'status\']==\'done\'),sum(1 for v in d.values() if v[\'status\']==\'failed\'))" 2>/dev/null')
    if res and res.count(" ") == 1:
        try:
            d, f = res.split()
            out["done"], out["failed"] = int(d), int(f)
        except ValueError:
            pass
    ff = ssh('pgrep -af "[f]fmpeg" | head -1')
    if ff:
        m = re.search(r"-i \"([^\"]+)\"", ff)
        out["ffmpeg"] = os.path.basename(m.group(1)) if m else ff[:80]
    out["proc_alive"] = bool(ssh('pgrep -f "[p]rocess_all.py" 2>/dev/null'))
    out["playlists"] = int(ssh('find /var/www/videos -maxdepth 2 -name playlist.m3u8 2>/dev/null | wc -l'))
    out["raw_size"] = ssh('du -sh /var/www/videos/raw/ 2>/dev/null | cut -f1')
    dfree = ssh('df -h / | tail -1')
    if dfree:
        parts = dfree.split()
        if len(parts) >= 4:
            out["disk_used"] = parts[2]
            out["disk_avail"] = parts[3]
    lu = ssh('grep "LEVA CONCLUIDA" /var/www/videos/process.log 2>/dev/null | tail -1')
    out["last_update"] = lu or None
    return out

def bar(frac, width=30):
    done = int(round(frac * width))
    return "[" + "#" * done + "-" * (width - done) + "]"

def render(s):
    total = TOTAL
    done = s["done"]
    frac = done / total
    pct = frac * 100
    lines = []
    lines.append("\033[1mTropa dos Dados — Processamento de Vídeos (VPS)\033[0m")
    lines.append("")
    lines.append(f"  {bar(frac)} {pct:5.1f}%  ({done}/{total} concluídos)")
    lines.append("")
    lines.append(f"  Processo no VPS : {'\033[32mRODANDO\033[0m' if s['proc_alive'] else '\033[31mPARADO\033[0m'}")
    lines.append(f"  Convertendo agora: {s['ffmpeg'] or '—'}")
    lines.append(f"  Fila            : {done} feitos, {s['failed']} falhas, {max(1, TOTAL - done - s['failed'])} restantes")
    lines.append(f"  Playlists HLS   : {s['playlists']} (base 3 + {done} novos)")
    lines.append(f"  Downloads (raw) : {s['raw_size']}")
    lines.append(f"  Disco           : usado {s['disk_used']}, livre {s['disk_avail']}")
    if s["last_update"]:
        lines.append(f"  Última leva     : concluída {s['last_update']}")
    return "\n".join(lines)

def main():
    intervals = int(os.environ.get("PROG_INTERVAL", "10"))
    once = "--once" in sys.argv
    try:
        while True:
            s = fetch()
            sys.stdout.write("\033[H\033[2J" + render(s) + "\n")
            sys.stdout.flush()
            if once or s["last_update"]:
                break
            time.sleep(intervals)
    except KeyboardInterrupt:
        print("\nmonitor encerrado")

if __name__ == "__main__":
    main()