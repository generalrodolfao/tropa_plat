import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileTextService } from '../common/file-text.service';

export type SaveCvReview = {
  overallScore: number;
  summary: string;
  sections: Array<{ title: string; score: number; feedback: string }>;
  atsScore: number;
  strengths: string[];
  improvements: string[];
};

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileText: FileTextService,
  ) {}

  async getCurrent(userId: string) {
    const cv = await this.prisma.cv.findFirst({
      where: { userId, isCurrent: true },
      include: { review: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!cv) return { cv: null, review: null, text: null };

    const parsed = (cv.parsed ?? {}) as Record<string, unknown>;
    return {
      cv,
      review: cv.review,
      text: (parsed.text as string) ?? null,
    };
  }

  async save(
    userId: string,
    data: { text: string; parsed?: unknown; review?: SaveCvReview },
  ) {
    const existing = await this.prisma.cv.findFirst({
      where: { userId, isCurrent: true },
    });

    const parsed = {
      text: data.text,
      ...(typeof data.parsed === 'object' && data.parsed
        ? (data.parsed as Record<string, unknown>)
        : {}),
    };

    const cv = existing
      ? await this.prisma.cv.update({
          where: { id: existing.id },
          data: { parsed: parsed as any, parseStatus: 'done' },
        })
      : await this.prisma.cv.create({
          data: {
            userId,
            filename: 'cv-colado.txt',
            storageKey: `inline:${userId}`,
            mime: 'text/plain',
            parseStatus: 'done',
            parsed: parsed as any,
            isCurrent: true,
          },
        });

    if (data.review) {
      const r = data.review;
      await this.prisma.cvReview.upsert({
        where: { cvId: cv.id },
        create: {
          cvId: cv.id,
          status: 'done',
          overallScore: r.overallScore,
          summaryMd: r.summary,
          sections: r.sections as any,
          atsScore: r.atsScore,
          strengths: r.strengths as any,
          improvements: r.improvements as any,
        },
        update: {
          status: 'done',
          overallScore: r.overallScore,
          summaryMd: r.summary,
          sections: r.sections as any,
          atsScore: r.atsScore,
          strengths: r.strengths as any,
          improvements: r.improvements as any,
        },
      });
    }

    return this.getCurrent(userId);
  }

  // ---------- Extração de texto de arquivos (PDF / DOC / DOCX / TXT) ----------

  async extractText(
    filename: string,
    mime: string,
    base64: string,
  ): Promise<{ text: string; filename: string }> {
    const { text } = await this.fileText.extractText(filename, mime, base64);
    if (text.length < 50) {
      throw new BadRequestException(
        'Não foi possível extrair o texto do arquivo (pouco conteúdo). Confirme se o arquivo não é um print/imagem.',
      );
    }
    return { text, filename };
  }
}
