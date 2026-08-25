import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrailsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, difficulty?: string) {
    const where: any = { userId };
    if (difficulty) where.difficulty = difficulty;

    const trails = await this.prisma.trail.findMany({
      where,
      include: {
        course: { select: { id: true, slug: true, title: true, level: true, xpTotal: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // enrich with progress via lessonProgress count (if needed)
    return trails.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      difficulty: t.difficulty,
      status: t.status,
      progress: t.progress,
      course: t.course,
      createdAt: t.createdAt,
    }));
  }

  async get(userId: string, trailId: string) {
    const trail = await this.prisma.trail.findFirst({
      where: { id: trailId, userId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: { orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    const lessonIds = trail.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, status: true, completedAt: true },
    });
    const completed = progress.filter((p) => p.status === 'completed').length;
    const total = lessonIds.length;
    const progressPct = total ? Math.round((completed / total) * 100) : trail.progress;

    return {
      id: trail.id,
      name: trail.name,
      description: trail.description,
      difficulty: trail.difficulty,
      status: trail.status,
      progress: trail.progress,
      progressPct,
      course: trail.course,
      lessonProgress: progress,
      stats: { total, completed, remaining: total - completed },
    };
  }

  async create(
    userId: string,
    name: string,
    description: string,
    courseId: string,
    difficulty: string = 'intermediate',
  ) {
    // valida curso existe
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    // evita duplicata user+course
    const exists = await this.prisma.trail.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (exists) throw new ConflictException('Trilha já existe para este curso');

    const trail = await this.prisma.trail.create({
      data: { name, description, difficulty, userId, courseId, progress: 0, status: 'active' },
      include: { course: { select: { id: true, slug: true, title: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'trail.create',
        resourceType: 'trail',
        resourceId: trail.id,
        after: { courseId, name } as any,
      },
    });

    return trail;
  }

  async updateProgress(userId: string, trailId: string, completedLessonIds: string[]) {
    const trail = await this.prisma.trail.findFirst({ where: { id: trailId, userId } });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    // marca lições como completed se ainda não estiverem
    for (const lessonId of completedLessonIds) {
      await this.prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: { userId, lessonId, status: 'completed', completedAt: new Date() },
        update: { status: 'completed', completedAt: new Date() },
      });
    }

    // recalcula progresso real
    const course = await this.prisma.trail.findUnique({
      where: { id: trailId },
      include: { course: { include: { modules: { include: { lessons: true } } } } },
    });
    const total = course!.course.modules.flatMap((m) => m.lessons).length;
    const completed = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: course!.course.modules.flatMap((m) => m.lessons.map((l) => l.id)) }, status: 'completed' },
    });
    const pct = total ? Math.round((completed / total) * 100) : 0;

    await this.prisma.trail.update({
      where: { id: trailId },
      data: { progress: pct, status: pct >= 100 ? 'completed' : 'active' },
    });

    return { progress: pct, completed, total };
  }

  async remove(userId: string, trailId: string) {
    const trail = await this.prisma.trail.findFirst({ where: { id: trailId, userId } });
    if (!trail) throw new NotFoundException('Trilha não encontrada');
    await this.prisma.trail.delete({ where: { id: trailId } });
    return { ok: true };
  }
}
