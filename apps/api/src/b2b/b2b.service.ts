import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EngagementReportDto } from './dto/b2b.dto';

@Injectable()
export class B2BService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Get company dashboard ----------

  async getCompanyDashboard(userId: string) {
    // Get user's organization membership
    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!membership) {
      throw new ForbiddenException('Você não pertence a nenhuma organização');
    }

    const org = membership.organization;

    // Get team members
    const members = await this.prisma.companyMembership.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userXp: {
              select: { totalXp: true, level: true },
            },
          },
        },
      },
    });

    // Get engagement metrics
    const memberIds = members.map((m) => m.userId);

    const [progressCount, quizAttempts, projectSubmissions] = await Promise.all(
      [
        this.prisma.lessonProgress.count({
          where: {
            userId: { in: memberIds },
            completedAt: { not: null },
          },
        }),
        this.prisma.quizAttempt.count({
          where: { userId: { in: memberIds } },
        }),
        this.prisma.projectSubmission.count({
          where: { userId: { in: memberIds } },
        }),
      ],
    );

    // Calculate average progress
    const totalLessons = await this.prisma.lesson.count();
    const avgProgress =
      totalLessons > 0
        ? Math.round((progressCount / (members.length * totalLessons)) * 100)
        : 0;

    return {
      organization: {
        id: org.id,
        name: org.name,
        type: org.type,
      },
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        xp: m.user.userXp?.totalXp ?? 0,
        level: m.user.userXp?.level ?? 1,
        joinedAt: m.createdAt,
        role: m.role,
      })),
      metrics: {
        totalMembers: members.length,
        avgProgress,
        totalQuizAttempts: quizAttempts,
        totalProjectSubmissions: projectSubmissions,
        activeLast7Days: await this.getActiveMembers(memberIds, 7),
        activeLast30Days: await this.getActiveMembers(memberIds, 30),
      },
    };
  }

  // ---------- Get member progress ----------

  async getMemberProgress(userId: string, memberId: string) {
    // Verify user has access
    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new ForbiddenException('Acesso negado');
    }

    // Verify member belongs to same organization
    const memberMembership = await this.prisma.companyMembership.findFirst({
      where: {
        userId: memberId,
        organizationId: membership.organizationId,
      },
    });

    if (!memberMembership) {
      throw new NotFoundException('Membro não encontrado');
    }

    const [skillScores, lessonProgress, quizAttempts, projectSubmissions] =
      await Promise.all([
        this.prisma.skillScore.findMany({
          where: { userId: memberId },
          include: { skill: true },
        }),
        this.prisma.lessonProgress.findMany({
          where: { userId: memberId, completedAt: { not: null } },
          include: {
            lesson: {
              select: { title: true, module: { select: { title: true } } },
            },
          },
        }),
        this.prisma.quizAttempt.findMany({
          where: { userId: memberId },
          orderBy: { startedAt: 'desc' },
          take: 10,
        }),
        this.prisma.projectSubmission.findMany({
          where: { userId: memberId },
          include: { project: { select: { title: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
      ]);

    return {
      skills: skillScores.map((s) => ({
        name: s.skill.name,
        level: s.level,
        confidence: s.confidence,
      })),
      completedLessons: lessonProgress.length,
      recentQuizzes: quizAttempts,
      recentProjects: projectSubmissions,
    };
  }

  // ---------- Get engagement report ----------

  async getEngagementReport(userId: string, dto: EngagementReportDto) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId },
    });

    if (!membership) {
      throw new ForbiddenException('Acesso negado');
    }

    const memberIds = dto.memberIds?.length
      ? dto.memberIds
      : (
          await this.prisma.companyMembership.findMany({
            where: { organizationId: membership.organizationId },
            select: { userId: true },
          })
        ).map((m) => m.userId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const [lessonProgress, quizAttempts, xpEvents] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: {
          userId: { in: memberIds },
          completedAt: { gte: startDate, lte: endDate },
        },
        select: { userId: true, completedAt: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: {
          userId: { in: memberIds },
          startedAt: { gte: startDate, lte: endDate },
        },
        select: { userId: true, score: true, startedAt: true },
      }),
      this.prisma.xpEvent.findMany({
        where: {
          userId: { in: memberIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { userId: true, amount: true, createdAt: true },
      }),
    ]);

    // Group by user
    const byUser: Record<string, any> = {};
    for (const id of memberIds) {
      byUser[id] = {
        userId: id,
        lessonsCompleted: lessonProgress.filter((l) => l.userId === id).length,
        quizzesTaken: quizAttempts.filter((q) => q.userId === id).length,
        avgScore: this.average(
          quizAttempts.filter((q) => q.userId === id).map((q) => q.score),
        ),
        xpEarned: xpEvents
          .filter((x) => x.userId === id)
          .reduce((sum, x) => sum + x.amount, 0),
        activeDays: new Set(
          xpEvents
            .filter((x) => x.userId === id)
            .map((x) => x.createdAt.toISOString().split('T')[0]),
        ).size,
      };
    }

    return {
      period: { startDate, endDate },
      summary: {
        totalLessonsCompleted: lessonProgress.length,
        totalQuizzesTaken: quizAttempts.length,
        totalXpEarned: xpEvents.reduce((sum, x) => sum + x.amount, 0),
        avgEngagementRate: this.calculateEngagementRate(
          memberIds.length,
          xpEvents,
          startDate,
          endDate,
        ),
      },
      byUser: Object.values(byUser),
    };
  }

  // ---------- Helper methods ----------

  private async getActiveMembers(
    memberIds: string[],
    days: number,
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const active = await this.prisma.xpEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        createdAt: { gte: since },
      },
    });

    return active.length;
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
  }

  private calculateEngagementRate(
    totalMembers: number,
    xpEvents: any[],
    startDate: Date,
    endDate: Date,
  ): number {
    if (totalMembers === 0) return 0;
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const activeUsers = new Set(xpEvents.map((x) => x.userId)).size;
    return Math.round((activeUsers / totalMembers) * 100);
  }
}
