import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class LeaguesService {
  private readonly logger = new Logger(LeaguesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

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

    // Broadcast new league to all connected users
    this.realtime.emitToAll('league:new', {
      leagueId: league.id,
      season: league.season,
      cohortSize,
      promotionCount,
    });

    return league;
  }

  /** Job semanal: marca a liga da semana anterior como settled e reseta week_xp. */
  async settlePreviousLeague() {
    const now = new Date();
    const monday = this.weekStart();

    const prevWeekEnd = new Date(monday.getTime() - 24 * 60 * 60 * 1000);
    const settled = await this.prisma.league.updateMany({
      where: {
        status: 'open',
        weekEnd: { lte: prevWeekEnd },
      },
      data: { status: 'settled' },
    });

    // Get users for promotion/relegation broadcast
    const previousLeague = await this.prisma.league.findFirst({
      where: { status: 'settled', weekEnd: { lte: prevWeekEnd } },
      include: {
        rankings: {
          orderBy: { rank: 'asc' },
          select: { userId: true, rank: true, eligiblePromotion: true },
        },
      },
      orderBy: { weekEnd: 'desc' },
    });

    if (previousLeague) {
      const promoted = previousLeague.rankings.filter(
        (r) => r.eligiblePromotion,
      );
      const relegated = previousLeague.rankings.filter(
        (r) =>
          r.rank > previousLeague.cohortSize - previousLeague.promotionCount,
      );

      // Notify promoted users
      for (const user of promoted) {
        this.realtime.emitToUser(user.userId, 'league:promoted', {
          leagueId: previousLeague.id,
          rank: user.rank,
        });
      }

      // Notify relegated users
      for (const user of relegated) {
        this.realtime.emitToUser(user.userId, 'league:relegated', {
          leagueId: previousLeague.id,
          rank: user.rank,
        });
      }

      // Broadcast settled event
      this.realtime.emitToAll('league:settled', {
        leagueId: previousLeague.id,
        promotedCount: promoted.length,
        relegatedCount: relegated.length,
      });
    }

    await this.prisma.userXp.updateMany({
      where: { weekXp: { gt: 0 } },
      data: { weekXp: 0 },
    });

    this.logger.log(
      `Ligas encerradas: ${settled.count} · week_xp zerado (${now.toISOString()})`,
    );
    return settled.count;
  }

  /** Broadcast ranking updates in real-time */
  async broadcastRankingUpdate(leagueId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        rankings: {
          orderBy: { rank: 'asc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (league) {
      this.realtime.emitToAll('league:ranking-update', {
        leagueId,
        rankings: league.rankings,
      });
    }
  }

  /** Job semanal: criação + encerramento da liga anterior. */
  async weeklyLeagueJob() {
    const last = await this.prisma.league.findFirst({
      orderBy: { season: 'desc' },
      select: { season: true },
    });
    const season = (last?.season ?? 0) + 1;

    await this.settlePreviousLeague();
    const league = await this.createWeeklyLeague(season);
    this.logger.log(
      `Liga da semana criada: season ${season} (${league.cohortSize} membros)`,
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
