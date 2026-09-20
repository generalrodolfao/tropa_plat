import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LeaguesService } from '../leagues/leagues.service';
import { XpService } from '../xp/xp.service';
import { EmailService } from '../email/email.module';
import {
  weeklyProgressEmail,
  onboardingNudgeEmail,
  missionDueEmail,
  seatExpiryEmail,
  streakAlertEmail,
  type DueItem,
} from '../email/email-templates';

/**
 * Jobs de manutenção/domínio que rodam em background.
 * A spec manda manter workers como processo separado quando escalar;
 * por ora rodam no mesmo serviço sempre ativo (Railway) via @nestjs/schedule.
 */
@Injectable()
export class WorkerJobs {
  private readonly logger = new Logger(WorkerJobs.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leagues: LeaguesService,
    private readonly xp: XpService,
    private readonly email: EmailService,
  ) {}

  /** Segunda-feira 00:05 UTC — encerra a liga anterior e cria a da semana. */
  @Cron(CronExpression.EVERY_WEEK, { name: 'weekly-league' })
  async weeklyLeague() {
    this.logger.log('[worker] Iniciando job semanal de ligas...');
    try {
      const league = await this.leagues.weeklyLeagueJob();
      this.logger.log(
        `[worker] Liga da semana pronta (${league.cohortSize} membros).`,
      );
    } catch (err) {
      this.logger.error(
        `[worker] Falha no job de liga: ${(err as Error).message}`,
      );
    }
  }

  /** Diário 00:15 UTC — aplica freezes ou zera streaks em dia sem atividade. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'daily-streaks' })
  async dailyStreaks() {
    this.logger.log('[worker] Iniciando job diário de streaks...');
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const streaks = await this.prisma.streak.findMany();

    let reset = 0;
    let frozen = 0;
    for (const s of streaks) {
      const last = s.lastActivityDate ? new Date(s.lastActivityDate) : null;
      if (last && last.getTime() === today.getTime()) continue;

      if (s.freezesAvailable > 0) {
        await this.prisma.streak.update({
          where: { id: s.id },
          data: {
            freezesAvailable: { decrement: 1 },
            freezesUsed: { increment: 1 },
          },
        });
        frozen++;
      } else if (s.current > 0) {
        await this.prisma.streak.update({
          where: { id: s.id },
          data: { current: 0 },
        });
        reset++;
      }
    }

    this.logger.log(
      `[worker] Streaks: ${frozen} congeladas, ${reset} zeradas.`,
    );
  }

  /** Diário 14:00 UTC (11h BRT) — nudges de onboarding para quem não concluiu. */
  @Cron('0 14 * * *', { name: 'email-onboarding-nudge' })
  async onboardingNudge() {
    if (!this.email.enabled) return;
    this.logger.log('[worker] Enviando nudges de onboarding...');
    const now = new Date();
    const createdAfter = new Date(now.getTime() - 4 * 24 * 3600_000);
    const users = await this.prisma.user.findMany({
      where: {
        status: 'active',
        createdAt: { gt: createdAfter },
        AND: [
          { profile: { careerGoal: null } },
          { profile: { onboardingDoneAt: null } },
        ],
      },
      select: { email: true, name: true },
      take: 300,
    });
    const sent = await this.email.sendBatch(
      users.map((u) => ({
        to: u.email,
        content: onboardingNudgeEmail(u.name, this.appUrl),
      })),
    );
    this.logger.log(`[worker] Nudge onboarding: ${sent} e-mails.`);
  }

  /** Dias úteis 13:00 UTC (10h BRT) — vencimento de empreitadas (PDI + hackathons). */
  @Cron('0 13 * * 1-5', { name: 'email-mission-due' })
  async missionDue() {
    if (!this.email.enabled) return;
    this.logger.log('[worker] Checando vencimento de empreitadas...');
    const now = new Date();
    const in5 = new Date(now.getTime() + 5 * 24 * 3600_000);
    const in7 = new Date(now.getTime() + 7 * 24 * 3600_000);

    const byUser = new Map<
      string,
      { email: string; name: string; items: DueItem[] }
    >();
    const push = (
      userId: string,
      email: string,
      name: string,
      item: DueItem,
    ) => {
      let entry = byUser.get(userId);
      if (!entry) {
        entry = { email, name, items: [] };
        byUser.set(userId, entry);
      }
      entry.items.push(item);
    };

    // PDI — os marcos não têm due date própria; emprendidas com prazo reais:
    // faturas pendentes (Payment.dueDate) nos próximos 7 dias
    const duePayments = await this.prisma.payment.findMany({
      where: { status: 'pending', dueDate: { gt: now, lte: in7 } },
      include: { subscription: { include: { user: true } } },
    });
    for (const p of duePayments) {
      const u = p.subscription?.user;
      if (!u || u.status !== 'active') continue;
      push(u.id, u.email, u.name, {
        kind: 'payment',
        label: 'Fatura da assinatura',
        dueLabel: `vence ${this.brDate(new Date(p.dueDate))}`,
        detail: `Valor ${this.brl(p.amountCents)} — evite suspensão de acesso`,
      });
    }

    // Hackathons — deadline de submissão para membros de times
    const teamMembers = await this.prisma.hackathonTeamMember.findMany({
      include: {
        team: {
          select: {
            hackathon: { select: { title: true, submissionDeadline: true } },
          },
        },
      },
    });
    const userIdsOfMembers = [...new Set(teamMembers.map((m) => m.userId))];
    const relevantUsers = userIdsOfMembers.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIdsOfMembers }, status: 'active' },
          select: { id: true, email: true, name: true },
        })
      : [];
    const userById = new Map(relevantUsers.map((u) => [u.id, u]));

    for (const m of teamMembers) {
      const u = userById.get(m.userId);
      const dl = m.team?.hackathon?.submissionDeadline;
      const deadline = dl ? new Date(dl) : null;
      if (!u || !deadline || deadline < now || deadline > in5) continue;
      push(u.id, u.email, u.name, {
        kind: 'hackathon',
        label: `Submissão — ${m.team?.hackathon?.title ?? 'Hackathon'}`,
        dueLabel: `entrega ${this.brDate(deadline)}`,
        detail: 'Prazo limite para submeter o projeto',
      });
    }

    const batch = [...byUser.values()].map((e) => ({
      to: e.email,
      content: missionDueEmail(e.name, e.items, this.appUrl),
    }));
    const sent = await this.email.sendBatch(batch);
    this.logger.log(`[worker] Prazos: ${sent} e-mails.`);
  }

  /** Diário 07:00 UTC — seats corporativos vencendo em até 14 dias → org_admin. */
  @Cron('0 7 * * *', { name: 'email-seat-expiry' })
  async seatExpiryEmailJob() {
    if (!this.email.enabled) return;
    this.logger.log('[worker] Checando seats vencendo...');
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 24 * 3600_000);
    const expiring = await this.prisma.companyMembership.findMany({
      where: { seatActive: true, seatExpiresAt: { lte: in14, gt: now } },
      select: { organizationId: true, seatExpiresAt: true },
    });
    if (expiring.length === 0) return;
    const admins = await this.prisma.companyMembership.findMany({
      where: {
        role: 'admin',
        organizationId: {
          in: [...new Set(expiring.map((e) => e.organizationId))],
        },
      },
      include: { organization: true, user: true },
    });
    const batch = admins.map((a) => {
      const hits = expiring.filter(
        (e) => e.organizationId === a.organizationId,
      );
      return {
        to: a.user.email,
        content: seatExpiryEmail(
          a.user.name,
          a.organization.name,
          hits.length,
          this.brDate(new Date(hits[0]?.seatExpiresAt ?? now)),
          this.appUrl,
        ),
      };
    });
    const sent = await this.email.sendBatch(batch);
    this.logger.log(`[worker] Seat expiry: ${sent} e-mails.`);
  }

  /** Diário 21:00 UTC (18h BRT) — streak em risco de zerar hoje. */
  @Cron('0 21 * * *', { name: 'email-streak-alert' })
  async streakAlert() {
    if (!this.email.enabled) return;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const risky = await this.prisma.streak.findMany({
      where: {
        current: { gte: 2 },
        OR: [{ lastActivityDate: null }, { lastActivityDate: { lt: today } }],
      },
      include: { user: true },
      take: 400,
    });
    const sent = await this.email.sendBatch(
      risky
        .filter((s) => s.user.status === 'active' && s.user.email)
        .map((s) => ({
          to: s.user.email,
          content: streakAlertEmail(s.user.name, s.longest, this.appUrl),
        })),
    );
    this.logger.log(`[worker] Streak alert: ${sent} e-mails.`);
  }

  /** Segunda 15:00 UTC (12h BRT) — digest semanal para quem treinou na semana. */
  @Cron('0 15 * * 1', { name: 'email-weekly-progress' })
  async weeklyProgress() {
    if (!this.email.enabled) return;
    this.logger.log('[worker] Digest semanal...');
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);

    const users = await this.prisma.user.findMany({
      where: { status: 'active', userXp: { weekXp: { gt: 0 } } },
      include: { userXp: true, streak: true },
      take: 500,
    });

    const batch: Array<{
      to: string;
      content: ReturnType<typeof weeklyProgressEmail>;
    }> = [];
    for (const u of users) {
      const xpEvents = await this.prisma.xpEvent.findMany({
        where: { userId: u.id, createdAt: { gte: weekAgo } },
        select: { type: true },
      });
      const { current, next } = XpService.rankFor(u.userXp?.totalXp ?? 0);
      const progress = next
        ? Math.round(
            (((u.userXp?.totalXp ?? 0) - current.xp) / (next.xp - current.xp)) *
              100,
          )
        : 100;
      batch.push({
        to: u.email,
        content: weeklyProgressEmail({
          name: u.name,
          weekXp: u.userXp?.weekXp ?? 0,
          streak: u.streak?.current ?? 0,
          longestStreak: u.streak?.longest ?? 0,
          rank: current.title,
          nextRank: next?.title ?? 'Lenda',
          nextRankProgress: Math.max(0, Math.min(100, progress)),
          lessonsCompleted: xpEvents.filter((e) => e.type === 'lesson_complete')
            .length,
          quizzesPassed: xpEvents.filter((e) => e.type === 'quiz_pass').length,
          appUrl: this.appUrl,
        }),
      });
    }
    const sent = await this.email.sendBatch(batch);
    this.logger.log(`[worker] Digest semanal: ${sent} e-mails.`);
  }

  private readonly BRT_OFFSET_MS = -3 * 3600_000;

  private get appUrl(): string {
    return (
      process.env.WEB_APP_URL ?? 'https://web-production-7b81.up.railway.app'
    ).replace(/\/$/, '');
  }

  private brl(cents: number): string {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  }

  private brDate(d: Date): string {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      timeZone: 'America/Sao_Paulo',
    });
  }

  /** A cada 6h — avalia badges declarativas e credita XP. */
  @Cron('0 */6 * * *', { name: 'badge-evaluation' })
  async badges() {
    this.logger.log('[worker] Iniciando avaliação de badges...');
    const badges = await this.prisma.badge.findMany();
    const users = await this.prisma.user.findMany({
      include: { userXp: true, streak: true, badges: true },
    });

    let awarded = 0;
    for (const badge of badges) {
      const criteria = (badge.criteria ?? {}) as Record<string, unknown>;
      for (const user of users) {
        if (user.badges.some((ub) => ub.badgeId === badge.id)) continue;
        if (this.evalCriteria(criteria, user)) {
          await this.prisma.userBadge.create({
            data: { userId: user.id, badgeId: badge.id, earnedAt: new Date() },
          });
          await this.xp.award(
            user.id,
            'badge',
            (criteria.xpReward as number) ?? 100,
            `badge-${badge.code}-${user.id}`,
          );
          awarded++;
        }
      }
    }
    this.logger.log(`[worker] Badges concedidas: ${awarded}.`);
  }

  private evalCriteria(
    criteria: Record<string, unknown>,
    user: {
      userXp?: { totalXp: number } | null;
      streak?: { current: number } | null;
    },
  ): boolean {
    if (!criteria.type || criteria.type === 'and') {
      const ops = (criteria.ops as Array<Record<string, unknown>>) ?? [];
      return ops.every((op) => this.evalOp(op, user));
    }
    if (criteria.type === 'or') {
      const ops = (criteria.ops as Array<Record<string, unknown>>) ?? [];
      return ops.some((op) => this.evalOp(op, user));
    }
    return this.evalOp(criteria, user);
  }

  private evalOp(
    op: Record<string, unknown>,
    user: {
      userXp?: { totalXp: number } | null;
      streak?: { current: number } | null;
    },
  ): boolean {
    if (typeof op.xp_total === 'number') {
      return (user.userXp?.totalXp ?? 0) >= op.xp_total;
    }
    if (typeof op.streak === 'number') {
      return (user.streak?.current ?? 0) >= op.streak;
    }
    return false;
  }
}
