/**
 * Base dos templates de e-mail — layout militar dark + CTA.
 */

export const colors = {
  bg: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#7c3aed',
  accentText: '#c4b5fd',
  warn: '#f59e0b',
  danger: '#ef4444',
};

export interface CtaOptions {
  label: string;
  url: string;
}

export function cta({ label, url }: CtaOptions): string {
  return `<div style="margin:22px 0 4px"><a href="${url}" style="display:inline-block;background:${colors.accent};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 26px;border-radius:8px">${label}</a></div>`;
}

export function layout(title: string, body: string, appUrl: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${colors.text}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
    <tr><td style="padding:0 0 20px 4px;font-weight:700;font-size:18px;color:#fff;letter-spacing:.06em">TROPA<span style="color:${colors.accentText}">·DOS·DADOS</span></td></tr>
    <tr><td style="background:${colors.card};border:1px solid ${colors.border};border-radius:12px;padding:28px 30px;font-size:15px;line-height:1.6">
      ${body}
    </td></tr>
    <tr><td style="padding:16px 4px;color:${colors.muted};font-size:12px;line-height:1.5">
      Você recebeu este e-mail porque tem conta na Tropa dos Dados.<br>
      <a href="${appUrl}/app/perfil" style="color:${colors.muted}">Ajustes</a> &middot; <a href="${appUrl}" style="color:${colors.muted}">Abrir plataforma</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}
