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

  // ---- Admin — criação de conteúdo ----

  async createCourse(data: {
    slug: string;
    title: string;
    description?: string;
    level?: string;
  }) {
    return this.prisma.course.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        level: data.level ?? 'intermediario',
        status: 'published',
        publishedAt: new Date(),
        xpTotal: 0,
      },
    });
  }

  async createModule(
    courseId: string,
    data: { title: string; codename?: string; type?: string },
  ) {
    const count = await this.prisma.module.count({ where: { courseId } });
    return this.prisma.module.create({
      data: {
        courseId,
        title: data.title,
        codename: data.codename,
        type: data.type ?? 'watch',
        position: count + 1,
        estimatedMinutes: 0,
        xpAward: 0,
      },
    });
  }

  async createLesson(
    moduleId: string,
    data: {
      title: string;
      type: string;
      durationSec?: number;
      xpAward?: number;
      content?: any;
    },
  ) {
    const count = await this.prisma.lesson.count({ where: { moduleId } });
    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        type: data.type as any,
        position: count + 1,
        durationSec: data.durationSec ?? 600,
        xpAward: data.xpAward ?? 50,
        content: data.content ?? {},
      },
    });
  }

  async updateLesson(
    lessonId: string,
    data: { title?: string; content?: any },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
    });
  }

  async createEbook(data: {
    slug: string;
    title: string;
    category?: string;
    pages?: number;
  }) {
    return this.prisma.ebook.upsert({
      where: { slug: data.slug },
      create: {
        slug: data.slug,
        title: data.title,
        category: data.category ?? 'Geral',
        pages: data.pages ?? 100,
      },
      update: { title: data.title, category: data.category, pages: data.pages },
    });
  }

  async publishCourse(courseId: string) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'published', publishedAt: new Date() },
    });
  }

  /** Listagem admin (inclui rascunhos) — usada no painel /admin/cursos */
  async listForAdmin(opts: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: any[]; total: number }> {
    const where: any = {};
    if (opts.status) where.status = opts.status;
    if (opts.search) {
      where.OR = [
        { title: { contains: opts.search, mode: 'insensitive' as const } },
        { slug: { contains: opts.search, mode: 'insensitive' as const } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        include: {
          _count: { select: { modules: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total };
  }
}
