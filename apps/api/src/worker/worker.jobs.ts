import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LeaguesService } from '../leagues/leagues.service';
import { XpService } from '../xp/xp.service';

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
