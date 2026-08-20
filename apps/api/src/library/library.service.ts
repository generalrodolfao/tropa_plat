import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [ebooks, progress] = await Promise.all([
      this.prisma.ebook.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          category: true,
          pages: true,
        },
      }),
      this.prisma.readingProgress.findMany({
        where: { userId },
        select: {
          ebookId: true,
          readPages: true,
          status: true,
          completedAt: true,
        },
      }),
    ]);

    const byEbook = new Map(progress.map((p) => [p.ebookId, p]));
    const enriched = ebooks.map((b) => {
      const p = byEbook.get(b.id);
      return {
        ...b,
        readPages: p?.readPages ?? 0,
        status: p?.status ?? 'novo',
        completedAt: p?.completedAt ?? null,
      };
    });

    return {
      total: enriched.length,
      reading: enriched.filter((b) => b.status === 'lendo').length,
      done: enriched.filter((b) => b.status === 'concluido').length,
      ebooks: enriched,
    };
  }

  async getBySlug(userId: string, slug: string) {
    const ebook = await this.prisma.ebook.findUnique({ where: { slug } });
    if (!ebook) throw new NotFoundException('Ebook não encontrado');

    const progress = await this.prisma.readingProgress.findUnique({
      where: { userId_ebookId: { userId, ebookId: ebook.id } },
    });

    return { ...ebook, progress: progress ?? null };
  }

  async updateProgress(userId: string, ebookId: string, readPages: number) {
    const ebook = await this.prisma.ebook.findUnique({
      where: { id: ebookId },
    });
    if (!ebook) throw new NotFoundException('Ebook não encontrado');

    const capped = Math.min(readPages, ebook.pages);
    const done = capped >= ebook.pages;

    const progress = await this.prisma.readingProgress.upsert({
      where: { userId_ebookId: { userId, ebookId } },
      create: {
        userId,
        ebookId,
        readPages: capped,
        status: done ? 'concluido' : 'lendo',
        completedAt: done ? new Date() : null,
      },
      update: {
        readPages: capped,
        status: done ? 'concluido' : 'lendo',
        completedAt: done ? new Date() : null,
      },
    });

    const result: {
      status: string;
      progress: typeof progress;
      certificate?: unknown;
    } = {
      status: done ? 'concluido' : 'lendo',
      progress,
    };
    if (done) {
      result.certificate = await this.issueReadingCertificate(userId, ebook);
    }
    return result;
  }

  async listCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async issueReadingCertificate(
    userId: string,
    ebook: { id: string; title: string; pages: number },
  ) {
    const existing = await this.prisma.certificate.findFirst({
      where: { userId, type: 'reading', referenceId: ebook.id },
    });
    if (existing) return existing;

    const hours = Math.max(1, Math.round(ebook.pages / 15));
    const serial = `TDD-READ-${randomUUID().slice(0, 8).toUpperCase()}`;
    return this.prisma.certificate.create({
      data: {
        userId,
        type: 'reading',
        referenceId: ebook.id,
        title: ebook.title,
        hours,
        serial,
      },
    });
  }
}
