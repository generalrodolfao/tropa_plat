import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: { userId, lessonId, status: 'started' },
      update: {},
    });
    return { ok: true };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new Error('LESSON_NOT_FOUND');

    const uniqueKey = `lesson-${userId}-${lessonId}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        create: {
          userId,
          lessonId,
          status: 'completed',
          completedAt: new Date(),
        },
        update: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const alreadyEarned = await tx.xpEvent.findUnique({
        where: { uniqueKey },
      });
      if (!alreadyEarned && lesson.xpAward > 0) {
        await tx.xpEvent.create({
          data: {
            userId,
            type: 'lesson_complete',
            sourceId: lessonId,
            amount: lesson.xpAward,
            uniqueKey,
          },
        });
        await tx.userXp.upsert({
          where: { userId },
          create: { userId, totalXp: lesson.xpAward, weekXp: lesson.xpAward },
          update: {
            totalXp: { increment: lesson.xpAward },
            weekXp: { increment: lesson.xpAward },
          },
        });
      }

      return { ok: true, xpAwarded: lesson.xpAward };
    });
  }

  async getCourseProgress(userId: string, courseId: string) {
    const [lessons, progress] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          module: { courseId },
        },
        select: { id: true, xpAward: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { module: { courseId } },
          status: 'completed',
        },
        select: { lessonId: true, completedAt: true },
      }),
    ]);

    const completedIds = new Set(progress.map((p) => p.lessonId));
    const totalXp = lessons.reduce((a, l) => a + l.xpAward, 0);
    const earnedXp = progress.reduce(
      (a, p) => a + (lessons.find((l) => l.id === p.lessonId)?.xpAward ?? 0),
      0,
    );

    return {
      totalLessons: lessons.length,
      completedLessons: progress.length,
      progressPct: lessons.length
        ? Math.round((progress.length / lessons.length) * 100)
        : 0,
      earnedXp,
      totalXp,
      completedIds: [...completedIds],
    };
  }
}
