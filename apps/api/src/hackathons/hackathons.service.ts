import { Injectable, NotFoundException } from '@nestjs/common';
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
              include: { user: { select: { id: true, name: true } } },
            },
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

  async joinTeam(userId: string, teamId: string) {
    const team = await this.prisma.hackathonTeam.findUnique({
      where: { id: teamId },
      include: { members: true, hackathon: true },
    });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    if (team.members.length >= team.hackathon.maxTeamSize) {
      throw new Error('TEAM_FULL');
    }
    const existing = team.members.find((m) => m.userId === userId);
    if (existing) return { ok: true, alreadyMember: true };

    await this.prisma.hackathonTeamMember.create({
      data: { teamId, userId, role: 'member' },
    });
    return { ok: true };
  }
}
