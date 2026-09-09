import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListUsersDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) {
      where.roles = { some: { role: query.role } };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: true, roles: true, userXp: true, streak: true },
      }),
    ]);

    return {
      data: users.map((u) => this.toPublic(u)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, roles: true, userXp: true, streak: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.toPublic(user);
  }

  async getByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true, roles: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.toPublic(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (exists) throw new ConflictException('Email já em uso');
    }

    const userData: any = {};
    if (dto.name !== undefined) userData.name = dto.name;
    if (dto.email !== undefined) userData.email = dto.email.toLowerCase();
    if (dto.status !== undefined) userData.status = dto.status;
    if (dto.avatarUrl !== undefined) userData.avatarUrl = dto.avatarUrl;

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({ where: { id }, data: userData });
    }

    const profileData: any = {};
    if (dto.headline !== undefined) profileData.headline = dto.headline;
    if (dto.bio !== undefined) profileData.bio = dto.bio;
    if (dto.timezone !== undefined) profileData.timezone = dto.timezone;

    if (Object.keys(profileData).length > 0) {
      await this.prisma.profile.upsert({
        where: { userId: id },
        create: { userId: id, ...profileData },
        update: profileData,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'user.update',
        resourceType: 'user',
        resourceId: id,
        after: dto as any,
      },
    });

    return this.getById(id);
  }

  async softDelete(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: 'deleted', deletedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          action: 'user.soft_delete',
          resourceType: 'user',
          resourceId: id,
        },
      });
    });
    return { ok: true };
  }

  async hardDeleteLgpd(id: string, actorId: string) {
    // LGPD: anonimiza após soft delete
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.user.update({
      where: { id },
      data: {
        email: `deleted_${id}@deleted.local`,
        name: 'Usuário removido',
        avatarUrl: null,
        status: 'deleted',
        deletedAt: new Date(),
      },
    });
    await this.prisma.profile.deleteMany({ where: { userId: id } });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'user.lgpd_delete',
        resourceType: 'user',
        resourceId: id,
      },
    });
    return { ok: true };
  }

  async assignRole(
    userId: string,
    role: string,
    organizationId: string | undefined,
    actorId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const exists = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: role as any,
        organizationId: organizationId ?? null,
      } as any,
    });
    if (exists) throw new ConflictException('Usuário já possui este papel');

    await this.prisma.userRole.create({
      data: {
        userId,
        role: role as any,
        organizationId: organizationId as any,
      } as any,
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'user.assign_role',
        resourceType: 'user',
        resourceId: userId,
        after: { role, organizationId },
      },
    });
    return this.getById(userId);
  }

  async removeRole(userId: string, role: string, actorId: string) {
    await this.prisma.userRole.deleteMany({
      where: { userId, role: role as any } as any,
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'user.remove_role',
        resourceType: 'user',
        resourceId: userId,
        after: { role },
      },
    });
    return this.getById(userId);
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: true,
        userXp: true,
        streak: true,
        lessonProgress: true,
        xpEvents: { orderBy: { createdAt: 'desc' }, take: 100 },
        cvs: true,
        jobApplications: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    // remove passwordHash
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async stats() {
    const [total, active, suspended, deleted] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.user.count({ where: { status: 'deleted' } }),
    ]);
    return { total, active, suspended, deleted };
  }

  private toPublic(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      profile: user.profile
        ? {
            headline: user.profile.headline,
            bio: user.profile.bio,
            timezone: user.profile.timezone,
            learningStyle: user.profile.learningStyle,
            careerGoal: user.profile.careerGoal,
            linkedinUrl: user.profile.linkedinUrl,
            githubUrl: user.profile.githubUrl,
          }
        : null,
      roles: (user.roles ?? []).map((r: any) => ({
        role: r.role,
        organizationId: r.organizationId,
      })),
      xp: user.userXp
        ? {
            totalXp: user.userXp.totalXp,
            weekXp: user.userXp.weekXp,
            level: user.userXp.level,
          }
        : null,
      streak: user.streak
        ? { current: user.streak.current, longest: user.streak.longest }
        : null,
    };
  }
}
