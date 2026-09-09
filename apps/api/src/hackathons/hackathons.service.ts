import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HackathonsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const hackathons = await this.prisma.hackathon.findMany({
      where: { status: { in: ['open', 'running'] } },
      orderBy: { endAt: 'asc' },
      include: {
        prizes: { orderBy: { position: 'asc' } },
        teams: {
          select: {
            id: true,
            name: true,
            _count: { select: { members: true } },
          },
        },
      },
    });
    return hackathons;
  }

  async getById(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        prizes: { orderBy: { position: 'asc' } },
        teams: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            team: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
            scores: true,
          },
        },
      },
    });
    if (!hackathon) throw new NotFoundException('Hackathon não encontrado');
    return hackathon;
  }

  async myTeams(userId: string) {
    return this.prisma.hackathonTeamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            hackathon: true,
            members: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  // ---------- Create Team ----------

  async createTeam(userId: string, hackathonId: string, name: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon não encontrado');
    if (hackathon.status !== 'open') throw new Error('HACKATHON_NOT_OPEN');

    // Verificar se já tem equipe neste hackathon
    const existingMembership = await this.prisma.hackathonTeamMember.findFirst({
      where: { userId, team: { hackathonId } },
    });
    if (existingMembership) throw new Error('ALREADY_IN_TEAM');

    const team = await this.prisma.hackathonTeam.create({
      data: {
        hackathonId,
        name,
        leaderUserId: userId,
        members: {
          create: { userId, role: 'leader' },
        },
      },
      include: { members: true },
    });

    return team;
  }

  async joinTeam(userId: string, teamId: string) {
    const team = await this.prisma.hackathonTeam.findUnique({
      where: { id: teamId },
      include: { members: true, hackathon: true },
    });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    if (team.members.length >= team.hackathon.maxTeamSize) {
      throw new Error('TEAM_FULL');
    }

    // Verificar se já está em outra equipe deste hackathon
    const existingMembership = await this.prisma.hackathonTeamMember.findFirst({
      where: { userId, team: { hackathonId: team.hackathonId } },
    });
    if (existingMembership) throw new Error('ALREADY_IN_TEAM');

    const existing = team.members.find((m) => m.userId === userId);
    if (existing) return { ok: true, alreadyMember: true };

    await this.prisma.hackathonTeamMember.create({
      data: { teamId, userId, role: 'member' },
    });
    return { ok: true };
  }

  // ---------- Submit ----------

  async submit(
    userId: string,
    hackathonId: string,
    data: {
      title: string;
      repoUrl?: string;
      demoUrl?: string;
      description?: string;
    },
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon não encontrado');
    if (hackathon.status !== 'running' && hackathon.status !== 'open') {
      throw new Error('HACKATHON_NOT_ACCEPTING_SUBMISSIONS');
    }

    // Verificar se está em uma equipe
    const membership = await this.prisma.hackathonTeamMember.findFirst({
      where: { userId, team: { hackathonId } },
      include: { team: true },
    });

    // Verificar se já submeteu
    const existingSubmission = await this.prisma.hackathonSubmission.findFirst({
      where: { hackathonId, userId },
    });
    if (existingSubmission) throw new Error('ALREADY_SUBMITTED');

    const submission = await this.prisma.hackathonSubmission.create({
      data: {
        hackathonId,
        teamId: membership?.teamId ?? null,
        userId,
        title: data.title,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        storageKeys: data.description
          ? { description: data.description }
          : undefined,
        status: 'submitted',
      },
    });

    return submission;
  }

  // ---------- Score ----------

  async scoreSubmission(
    judgeId: string,
    submissionId: string,
    data: {
      criteriaScores: Record<string, number>;
      totalScore: number;
      feedbackMd?: string;
    },
  ) {
    // Verificar se é judge
    const submission = await this.prisma.hackathonSubmission.findUnique({
      where: { id: submissionId },
      include: { hackathon: true },
    });
    if (!submission) throw new NotFoundException('Submissão não encontrada');

    const judgeAssignment = await this.prisma.hackathonScore.findFirst({
      where: { submissionId, judgeId },
    });

    const score = await this.prisma.hackathonScore.upsert({
      where: {
        submissionId_judgeId: { submissionId, judgeId },
      },
      create: {
        submissionId,
        judgeId,
        criteriaScores: data.criteriaScores,
        totalScore: data.totalScore,
        feedbackMd: data.feedbackMd,
      },
      update: {
        criteriaScores: data.criteriaScores,
        totalScore: data.totalScore,
        feedbackMd: data.feedbackMd,
      },
    });

    return score;
  }

  async getSubmissions(hackathonId: string) {
    return this.prisma.hackathonSubmission.findMany({
      where: { hackathonId },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        scores: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getScores(submissionId: string) {
    return this.prisma.hackathonScore.findMany({
      where: { submissionId },
      include: {
        submission: {
          select: { id: true, title: true },
        },
      },
    });
  }

  // ---------- Admin ----------

  async createHackathon(data: {
    title: string;
    theme?: string;
    rulesMd?: string;
    startAt?: string;
    endAt?: string;
    submissionDeadline?: string;
    prizePoolCents?: number;
    maxTeamSize?: number;
    xpMultiplier?: number;
    judgingCriteria?: any;
    sponsorOrgId?: string;
  }) {
    return this.prisma.hackathon.create({
      data: {
        title: data.title,
        theme: data.theme,
        rulesMd: data.rulesMd,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        submissionDeadline: data.submissionDeadline
          ? new Date(data.submissionDeadline)
          : undefined,
        prizePoolCents: data.prizePoolCents ?? 0,
        maxTeamSize: data.maxTeamSize ?? 4,
        xpMultiplier: data.xpMultiplier ?? 1,
        judgingCriteria: data.judgingCriteria,
        sponsorOrgId: data.sponsorOrgId,
        status: 'draft',
      },
    });
  }

  async listAll() {
    return this.prisma.hackathon.findMany({
      include: {
        prizes: true,
        _count: { select: { teams: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(hackathonId: string, status: string) {
    return this.prisma.hackathon.update({
      where: { id: hackathonId },
      data: { status: status as any },
    });
  }
}
