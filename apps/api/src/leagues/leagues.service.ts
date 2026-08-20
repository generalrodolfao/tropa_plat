import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaguesService {
  constructor(private readonly prisma: PrismaService) {}

  async current(userId: string) {
    const monday = this.weekStart();
    const league = await this.prisma.league.findFirst({
      where: { weekStart: monday },
      include: {
        rankings: {
          orderBy: { rank: 'asc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!league) {
      return {
        active: false,
        message: 'Batalhão ainda não foi formado nesta semana',
      };
    }

    const promotionCount = league.promotionCount;
    const my = league.rankings.find((r) => r.userId === userId);
    const promotion = league.rankings.filter((r) => r.rank <= promotionCount);
    const relegation = league.rankings.filter(
      (r) => r.rank > league.cohortSize - promotionCount,
    );

    return {
      active: true,
      league: {
        id: league.id,
        season: league.season,
        weekStart: league.weekStart,
        weekEnd: league.weekEnd,
        cohortSize: league.cohortSize,
        promotionCount,
      },
      rankings: league.rankings,
      myRank: my ?? null,
      promotion,
      relegation,
    };
  }

  async history(userId: string, limit = 8) {
    return this.prisma.league.findMany({
      where: {
        status: 'settled',
        rankings: { some: { userId } },
      },
      orderBy: { weekStart: 'desc' },
      take: limit,
      select: {
        id: true,
        season: true,
        weekStart: true,
        weekEnd: true,
        cohortSize: true,
        promotionCount: true,
        rankings: {
          where: { userId },
          select: { rank: true, xp: true },
        },
      },
    });
  }

  /** Job semanal: cria league da semana corrente e rankeia por week_xp. */
  async createWeeklyLeague(season: number) {
    const monday = this.weekStart();
    const existing = await this.prisma.league.findFirst({
      where: { weekStart: monday },
    });
    if (existing) return existing;

    const users = await this.prisma.userXp.findMany({
      where: { weekXp: { gt: 0 } },
      orderBy: { weekXp: 'desc' },
      take: 50,
    });

    const cohortSize = users.length;
    const promotionCount = Math.ceil(cohortSize * 0.15);

    const league = await this.prisma.league.create({
      data: {
        season,
        weekStart: monday,
        weekEnd: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000),
        cohortSize,
        promotionCount,
      },
    });

    await Promise.all(
      users.map((u, i) =>
        this.prisma.leagueRanking.create({
          data: {
            leagueId: league.id,
            userId: u.userId,
            xp: u.weekXp,
            rank: i + 1,
            eligiblePromotion: i + 1 <= promotionCount,
          },
        }),
      ),
    );

    return league;
  }

  private weekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // segunda = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
