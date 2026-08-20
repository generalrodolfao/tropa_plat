import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type XpSource =
  | 'lesson_complete'
  | 'quiz_pass'
  | 'sandbox_complete'
  | 'project_graded'
  | 'streak_day'
  | 'hackathon'
  | 'badge'
  | 'daily_login'
  | 'referral'
  | 'reading';

export type RankInfo = {
  title: string;
  xp: number;
};

const RANKS: RankInfo[] = [
  { title: 'Recruta', xp: 0 },
  { title: 'Soldado', xp: 800 },
  { title: 'Sargento', xp: 2500 },
  { title: 'Cabo de Guerra', xp: 5000 },
  { title: 'Tenente', xp: 9000 },
  { title: 'Comandante', xp: 15000 },
];

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);

  constructor(private readonly prisma: PrismaService) {}

  static rankFor(xp: number): { current: RankInfo; next: RankInfo | null } {
    let current = RANKS[0];
    let next: RankInfo | null = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xp) current = RANKS[i];
      else {
        next = RANKS[i];
        break;
      }
    }
    return { current, next };
  }

  static ranks(): RankInfo[] {
    return RANKS;
  }

  /** Credita XP de forma idempotente (unique_key) e atualiza streak. */
  async award(
    userId: string,
    type: XpSource,
    amount: number,
    uniqueKey: string,
  ): Promise<{ awarded: boolean; totalXp: number }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.xpEvent.findUnique({
        where: { uniqueKey },
      });
      if (existing) {
        const totals = await tx.userXp.findUnique({ where: { userId } });
        return { awarded: false, totalXp: totals?.totalXp ?? 0 };
      }

      await tx.xpEvent.create({
        data: { userId, type, amount, uniqueKey },
      });

      await this.touchStreak(tx, userId);

      const totals = await tx.userXp.upsert({
        where: { userId },
        create: { userId, totalXp: amount, weekXp: amount },
        update: {
          totalXp: { increment: amount },
          weekXp: { increment: amount },
        },
      });

      return { awarded: true, totalXp: totals.totalXp };
    });
  }

  async getSummary(userId: string) {
    const [xp, streak] = await Promise.all([
      this.prisma.userXp.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
    ]);
    const total = xp?.totalXp ?? 0;
    const { current, next } = XpService.rankFor(total);
    const progress = next
      ? Math.min(100, ((total - current.xp) / (next.xp - current.xp)) * 100)
      : 100;
    return {
      totalXp: total,
      weekXp: xp?.weekXp ?? 0,
      rank: current.title,
      nextRank: next?.title ?? null,
      rankProgress: Math.round(progress),
      streak: streak?.current ?? 0,
      longestStreak: streak?.longest ?? 0,
    };
  }

  private async touchStreak(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userId: string,
  ) {
    const now = new Date();
    const streak = await tx.streak.findUnique({ where: { userId } });
    if (!streak) {
      await tx.streak.create({ data: { userId, current: 1, longest: 1 } });
      return;
    }

    const last = streak.lastActivityDate ?? new Date(0);
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (lastDay.getTime() === today.getTime()) return; // já contabilizado hoje

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDay.getTime() === yesterday.getTime();

    const next = isConsecutive ? streak.current + 1 : 1;
    await tx.streak.update({
      where: { userId },
      data: {
        current: next,
        longest: Math.max(streak.longest, next),
        lastActivityDate: today,
      },
    });

    if (next > 1 && next % 7 === 0) {
      await tx.xpEvent.upsert({
        where: { uniqueKey: `streak-day-${userId}-${today.toISOString()}` },
        create: {
          userId,
          type: 'streak_day',
          amount: 50,
          uniqueKey: `streak-day-${userId}-${today.toISOString()}`,
        },
        update: {},
      });
      await tx.userXp.update({
        where: { userId },
        data: {
          totalXp: { increment: 50 },
          weekXp: { increment: 50 },
        },
      });
    }
  }
}
