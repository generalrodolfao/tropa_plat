/**
 * Templates de e-mail (pt-BR) — Tropa dos Dados.
 * Cada função recebe dados e devolve { subject, html }.
 */
import { cta, layout, colors } from './email-base';

export interface MailContent {
  subject: string;
  html: string;
}

// ---------- 1. Boas-vindas (onboarding concluído) ----------
export function welcomeEmail(
  name: string,
  careerGoalLabel: string,
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  return {
    subject: 'Boas-vindas à Tropa! Seu treinamento começou 🎖️',
    html: layout(
      'Boas-vindas',
      `<h1 style="margin:0 0 6px;font-size:22px;color:#fff">Boas-vindas, Recruta ${nome}!</h1>
      <p style="margin:0 0 14px;color:${colors.muted}">Sua missão rumo a <strong style="color:${colors.accentText}">${careerGoalLabel}</strong> está desenhada.</p>
      <p>Como o treinamento funciona:</p>
      <ol style="margin:8px 0 4px;padding-left:20px">
        <li><strong>Diagnóstico</strong> — quiz de nivelamento pela IA</li>
        <li><strong>PDI</strong> — plano personalizado em marcos</li>
        <li><strong>Execução</strong> — aulas, sandbox e projetos, com XP por cada conclusão</li>
      </ol>
      <p style="margin:14px 0 0;color:${colors.muted};font-size:13px">Regra da Tropa: 25 minutos por dia batem 4 horas no domingo. Constância sobe a patente.</p>` +
        cta({ label: 'Iniciar primeira missão', url: `${appUrl}/app` }) +
        `<p style="margin:18px 0 0;color:${colors.muted};font-size:12px">Dica: concluir o primeiro módulo nos 3 primeiros dias rende bônus de XP e emblema de arranque.</p>`,
      appUrl,
    ),
  };
}

// ---------- 2. Lembrete de onboarding pendente ----------
export function onboardingNudgeEmail(
  name: string,
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  return {
    subject: `${nome}, falta pouco para liberar seus cursos`,
    html: layout(
      'Complete o onboarding',
      `<h1 style="margin:0 0 6px;font-size:20px;color:#fff">Seu acesso está quase liberado</h1>
      <p style="margin:0 0 12px">Você entrou na plataforma mas o onboarding não foi concluído. Em <strong>5 minutos</strong> você escolhe a carreira e a IA monta seu Plano de Desenvolvimento (PDI).</p>
      <p style="color:${colors.muted}">Sem o onboarding, o catálogo fica visível — mas sem trilha feito sob medida, sem XP e sem progresso salvo.</p>` +
        cta({
          label: 'Completar onboarding agora',
          url: `${appUrl}/onboarding`,
        }),
      appUrl,
    ),
  };
}

// ---------- 3. Digest semanal de progresso ----------
export interface WeeklyProgressData {
  name: string;
  weekXp: number;
  streak: number;
  longestStreak: number;
  rank: string;
  nextRank: string;
  nextRankProgress: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  leaguePosition?: number;
  appUrl: string;
}

export function weeklyProgressEmail(d: WeeklyProgressData): MailContent {
  const nome = d.name.split(' ')[0];
  const filled = Math.max(0, Math.min(10, Math.round(d.nextRankProgress / 10)));
  const bar = '🟩'.repeat(filled) + '⬜'.repeat(10 - filled);
  return {
    subject: `Sua semana na Tropa: ${d.weekXp} XP${d.streak > 0 ? ` · streak de ${d.streak} dias` : ''}`,
    html: layout(
      'Digest semanal',
      `<h1 style="margin:0 0 12px;font-size:20px;color:#fff">${nome}, relatório da sua semana</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px;text-align:center;width:23%"><div style="font-size:20px;font-weight:700;color:${colors.accentText}">${d.weekXp}</div><div style="font-size:11px;color:${colors.muted}">XP na semana</div></td>
        <td style="width:2%"></td>
        <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px;text-align:center;width:23%"><div style="font-size:20px;font-weight:700;color:${colors.accentText}">${d.lessonsCompleted}</div><div style="font-size:11px;color:${colors.muted}">aulas</div></td>
        <td style="width:2%"></td>
        <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px;text-align:center;width:23%"><div style="font-size:20px;font-weight:700;color:${colors.accentText}">${d.quizzesPassed}</div><div style="font-size:11px;color:${colors.muted}">quizzes</div></td>
        <td style="width:2%"></td>
        <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px;text-align:center;width:23%"><div style="font-size:20px;font-weight:700;color:${colors.accentText}">${d.streak}</div><div style="font-size:11px;color:${colors.muted}">dias seguidos</div></td>
      </tr></table>
      <p style="margin:16px 0 2px">Patente atual: <strong>${d.rank}</strong></p>
      <p style="margin:0;font-family:monospace;font-size:13px;color:${colors.muted}">${bar} ${d.nextRankProgress}% → ${d.nextRank}</p>
      ${d.leaguePosition ? `<p style="margin:12px 0 0;color:${colors.muted}">Posição na liga da semana: <strong style="color:${colors.text}">${d.leaguePosition}º</strong></p>` : ''}
      ${d.weekXp === 0 ? `<p style="margin:14px 0 0;color:${colors.warn}">⚠️ Esta semana você zerou. Uma volta de 25 min recoloca a Tropa na liderança.</p>` : ''}` +
        cta({ label: 'Continuar missão da semana', url: `${d.appUrl}/app` }),
      d.appUrl,
    ),
  };
}

// ---------- 4. Vencimento de empreitada (prazos) ----------
export interface DueItem {
  kind: 'pdi' | 'payment' | 'hackathon';
  label: string;
  dueLabel: string;
  detail: string;
}

export function missionDueEmail(
  name: string,
  items: DueItem[],
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid ${colors.border}">
            <strong style="color:${colors.text}">${i.label}</strong>
            <div style="color:${colors.muted};font-size:13px">${i.detail}</div>
          </td>
          <td style="padding:8px 0;text-align:right;white-space:nowrap;font-weight:700;color:${colors.warn}">${i.dueLabel}</td>
        </tr>`,
    )
    .join('');
  return {
    subject: `⏰ ${items.length} ${items.length === 1 ? 'empreitada vence' : 'empreitadas vencem'} em breve`,
    html: layout(
      'Prazos',
      `<h1 style="margin:0 0 6px;font-size:20px;color:#fff">${nome}, prazos na sua pauta</h1>
      <p style="margin:0 0 12px;color:${colors.muted}">XP de empreitada vale cheia se entregue dentro do prazo.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>` +
        cta({ label: 'Ver minhas empreitadas', url: `${appUrl}/app/pdi` }) +
        `<p style="margin:14px 0 0;color:${colors.muted};font-size:12px">Esta checagem roda todo dia às 13h UTC (10h BRT).</p>`,
      appUrl,
    ),
  };
}

// ---------- 5. Convite para workshop (B2B) ----------
export function workshopInviteEmail(
  name: string,
  orgName: string,
  workshopTitle: string,
  startLabel: string,
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  return {
    subject: `${orgName} convocou você: ${workshopTitle}`,
    html: layout(
      'Convite workshop',
      `<p style="margin:0 0 4px;color:${colors.muted};font-size:12px;letter-spacing:.08em">CONVOCAÇÃO · ${orgName.toUpperCase()}</p>
      <h1 style="margin:0 0 10px;font-size:20px;color:#fff">${workshopTitle}</h1>
      <p style="margin:0 0 10px">${nome}, sua organização contratou este workshop na Tropa e reservou um assento para você.</p>
      <p>Anotação: começo em <strong>${startLabel}</strong>. O conteúdo fica disponível por período limitado.</p>` +
        cta({ label: 'Confirmar presença', url: `${appUrl}/app/empresa` }) +
        `<p style="margin:14px 0 0;color:${colors.muted};font-size:12px">Ao confirmar, seu progresso no workshop fica visível ao RH de forma agregada — nunca respostas individuais.</p>`,
      appUrl,
    ),
  };
}

// ---------- 6. Seats corporativos vencendo (para o org_admin) ----------
export function seatExpiryEmail(
  adminName: string,
  orgName: string,
  seatsAffected: number,
  expiryLabel: string,
  appUrl: string,
): MailContent {
  return {
    subject: `⚠️ ${seatsAffected} ${seatsAffected === 1 ? 'licença vence' : 'licenças vencem'} em ${expiryLabel} — ${orgName}`,
    html: layout(
      'Vencimento de seats',
      `<h1 style="margin:0 0 8px;font-size:20px;color:#fff">Licenças do time ${orgName} vencendo</h1>
      <p style="margin:0 0 10px">${adminName}, <strong>${seatsAffected}</strong> ${seatsAffected === 1 ? 'licença expira' : 'licenças expiram'} em <strong>${expiryLabel}</strong>.</p>
      <p style="color:${colors.muted}">Após o vencimento o acesso fica suspenso. O progresso é preservado e volta no lugar com a reativação.</p>` +
        cta({ label: 'Renovar licenças', url: `${appUrl}/app/empresa` }),
      appUrl,
    ),
  };
}

// ---------- 7. Certificado pronto ----------
export function certificateReadyEmail(
  name: string,
  certTitle: string,
  serial: string,
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  return {
    subject: `🏆 Certificado liberado: ${certTitle}`,
    html: layout(
      'Certificado',
      `<h1 style="margin:0 0 8px;font-size:20px;color:#fff">Missão cumprida, ${nome}!</h1>
      <p style="margin:0 0 8px">Seu certificado de <strong style="color:${colors.accentText}">${certTitle}</strong> foi emitido.</p>
      <p style="color:${colors.muted};font-family:monospace;font-size:12px">Serial: ${serial}</p>` +
        cta({
          label: 'Ver e compartilhar certificado',
          url: `${appUrl}/app/certificados`,
        }),
      appUrl,
    ),
  };
}

// ---------- 8. Streak em risco ----------
export function streakAlertEmail(
  name: string,
  longestStreak: number,
  appUrl: string,
): MailContent {
  const nome = name.split(' ')[0];
  return {
    subject: `${nome}, seu streak está em risco — 25 min resolvem`,
    html: layout(
      'Streak em risco',
      `<h1 style="margin:0 0 6px;font-size:20px;color:#fff">Fogo apagando</h1>
      <p style="margin:0 0 10px">Hoje é o último dia antes de zerar a sequência (recorde: ${longestStreak} dias).</p>
      <p style="color:${colors.muted}">Um bloco de <strong>25 minutos</strong> mantém a honra — e o XP fluindo.</p>` +
        cta({ label: 'Assistir próxima aula', url: `${appUrl}/app` }),
      appUrl,
    ),
  };
}
