import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverUrl: true,
        level: true,
        xpTotal: true,
        modules: {
          select: {
            id: true,
            title: true,
            codename: true,
            type: true,
            estimatedMinutes: true,
            xpAward: true,
            lessons: {
              select: {
                id: true,
                title: true,
                position: true,
                type: true,
                xpAward: true,
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return courses.map((c) => ({
      ...c,
      lessonCount: c.modules.reduce((a, m) => a + m.lessons.length, 0),
    }));
  }

  async getBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: 'published' },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                requires: { select: { requiresLessonId: true } },
                requiredBy: { select: { lessonId: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!course) throw new NotFoundException('Trilha não encontrada');
    return course;
  }

  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, slug: true, title: true } },
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    return lesson;
  }
}
