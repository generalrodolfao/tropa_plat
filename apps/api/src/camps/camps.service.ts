import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { StartCampSessionDto, SubmitCampAnswerDto } from './dto/camps.dto';

interface CampItemSnapshot {
  questionId?: string;
  format: string;
  prompt: string;
  options?: string[];
  difficulty: number;
  _correctIndex?: number;
  _answerKey?: string;
  _explanation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable()
export class CampsService {
  private readonly logger = new Logger(CampsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AIService,
  ) {}

  // ---------- Listagem ----------

  async listCamps(userId: string): Promise<any[]> {
    const camps = await this.prisma.camp.findMany({
      where: { status: 'active' },
      orderBy: [{ position: 'asc' }, { title: 'asc' }],
    });
    if (camps.length === 0) return [];

    const campIds = camps.map((c) => c.id);

    const [counts, sessions] = await Promise.all([
      this.prisma.campQuestion.groupBy({
        by: ['campId', 'format'],
        where: { campId: { in: campIds }, status: 'active' },
        _count: { _all: true },
      }),
      this.prisma.campSession.findMany({
        where: { userId, status: 'finished', campId: { in: campIds } },
        select: { campId: true, score: true, startedAt: true },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const bankByCamp = new Map<string, Record<string, number>>();
    for (const row of counts) {
      const bag = bankByCamp.get(row.campId) ?? {};
      bag[row.format] = row._count._all;
      bankByCamp.set(row.campId, bag);
    }

    return camps.map((camp) => {
      const mine = sessions.filter((s) => s.campId === camp.id);
      const best = mine.reduce((max, s) => Math.max(max, s.score), 0);
      return {
        id: camp.id,
        slug: camp.slug,
        title: camp.title,
        description: camp.description,
        category: camp.category,
        icon: camp.icon,
        difficulty: camp.difficulty,
        formats: camp.formats,
        xpAward: camp.xpAward,
        bank: bankByCamp.get(camp.id) ?? {},
        stats: {
          sessions: mine.length,
          bestScore: best,
          lastPlayedAt: mine[0]?.startedAt ?? null,
        },
      };
    });
  }

  async getCamp(userId: string, slug: string): Promise<any> {
    const camp = await this.prisma.camp.findUnique({ where: { slug } });
    if (!camp || camp.status !== 'active') {
      throw new NotFoundException('CAMP_NOT_FOUND');
    }

    const [counts, sessions] = await Promise.all([
      this.prisma.campQuestion.groupBy({
        by: ['format'],
        where: { campId: camp.id, status: 'active' },
        _count: { _all: true },
      }),
      this.prisma.campSession.findMany({
        where: { userId, campId: camp.id },
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          format: true,
          mode: true,
          status: true,
          score: true,
          earnedXp: true,
          totalItems: true,
          startedAt: true,
          finishedAt: true,
        },
      }),
    ]);

    const bank: Record<string, number> = {};
    for (const row of counts) bank[row.format] = row._count._all;

    return { ...camp, bank, sessions };
  }

  // ---------- Sessões ----------

  async startSession(
    userId: string,
    slug: string,
    dto: StartCampSessionDto,
  ): Promise<any> {
    const camp = await this.prisma.camp.findUnique({ where: { slug } });
    if (!camp || camp.status !== 'active') {
      throw new NotFoundException('CAMP_NOT_FOUND');
    }

    const requested = dto.format && dto.format !== 'mixed' ? dto.format : null;
    if (requested && !camp.formats.includes(requested)) {
      throw new BadRequestException('FORMAT_NOT_AVAILABLE');
    }

    const formats = requested
      ? [requested]
      : camp.formats.length > 0
        ? camp.formats
        : ['quiz'];
    const count = dto.count ?? (dto.mode === 'hotseat' ? 8 : 5);
    const difficulty = dto.difficulty ?? 3;

    const distribution = this.distribute(count, formats);
    const picked: CampItemSnapshot[] = [];
    for (let i = 0; i < formats.length; i++) {
      const items = await this.pickItems(
        camp,
        formats[i],
        distribution[i],
        difficulty,
      );
      picked.push(...items);
    }

    const items = shuffle(picked).slice(0, count);
    if (items.length === 0) {
      throw new BadRequestException('CAMP_ITEMS_UNAVAILABLE');
    }

    const session = await this.prisma.campSession.create({
      data: {
        campId: camp.id,
        userId,
        format: requested ?? 'mixed',
        mode: dto.mode ?? 'standard',
        status: 'in_progress',
        totalItems: items.length,
        items: items as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      sessionId: session.id,
      mode: session.mode,
      format: session.format,
      totalItems: items.length,
      camp: {
        id: camp.id,
        slug: camp.slug,
        title: camp.title,
        category: camp.category,
        icon: camp.icon,
        xpAward: camp.xpAward,
      },
      items: this.sanitize(items),
    };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitCampAnswerDto,
  ): Promise<any> {
    const session = await this.prisma.campSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('SESSION_FINISHED');
    }

    const items = (session.items as unknown as CampItemSnapshot[]) ?? [];
    const item = items[dto.itemIndex];
    if (!item) throw new BadRequestException('ITEM_NOT_FOUND');

    // O gabarito vai no snapshot da sessão (nunca é exposto ao cliente)
    const resolved: CampItemSnapshot = item;

    const timeMs = dto.timeMs ?? 0;
    let correct: boolean;
    let score: number;
    let feedback: string;

    if (item.format === 'quiz') {
      if (typeof dto.chosenIndex !== 'number') {
        throw new BadRequestException('CHOSEN_INDEX_REQUIRED');
      }
      correct = resolved._correctIndex === dto.chosenIndex;
      score = correct ? 100 : 0;
      feedback = correct
        ? `Correto! ${resolved._explanation ?? ''}`.trim()
        : `Resposta incorreta. ${resolved._explanation ?? 'Reveja o conceito e tente novamente.'}`.trim();
    } else {
      const answer = (dto.text ?? '').trim();
      if (answer.length === 0) {
        correct = false;
        score = 0;
        feedback = 'Resposta em branco. Escreva algo antes de enviar.';
      } else {
        const camp = await this.prisma.camp.findUnique({
          where: { id: session.campId },
        });
        try {
          const graded = await this.ai.gradeCampAnswer({
            campTitle: camp?.title ?? 'Camp',
            format: item.format,
            prompt: resolved.prompt,
            answerKey: resolved._answerKey,
            answer,
          });
          correct = graded.correct;
          score = graded.score;
          feedback = graded.feedback;
        } catch (err) {
          this.logger.warn(`Correção via IA falhou: ${String(err)}`);
          const fallback = this.heuristicGrade(answer, resolved._answerKey);
          correct = fallback.correct;
          score = fallback.score;
          feedback = fallback.feedback;
        }
      }
    }

    const data = {
      sessionId,
      itemIndex: dto.itemIndex,
      format: item.format,
      prompt: resolved.prompt,
      answer: dto.text ?? null,
      chosenIndex: dto.chosenIndex ?? null,
      correct,
      score,
      feedback,
      timeMs,
    };

    await this.prisma.campAnswer.upsert({
      where: {
        sessionId_itemIndex: { sessionId, itemIndex: dto.itemIndex },
      },
      create: data,
      update: data,
    });

    return {
      itemIndex: dto.itemIndex,
      correct,
      score,
      feedback,
      correctIndex: item.format === 'quiz' ? resolved._correctIndex : undefined,
      answerKey: resolved._answerKey,
    };
  }

  async finishSession(userId: string, sessionId: string): Promise<any> {
    const session = await this.prisma.campSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    if (session.status === 'finished') {
      throw new BadRequestException('SESSION_ALREADY_FINISHED');
    }

    const [camp, answers] = await Promise.all([
      this.prisma.camp.findUnique({ where: { id: session.campId } }),
      this.prisma.campAnswer.findMany({
        where: { sessionId },
        orderBy: { itemIndex: 'asc' },
      }),
    ]);

    const total = Math.max(session.totalItems, answers.length, 1);
    const sum = answers.reduce((acc, a) => acc + a.score, 0);
    const score = Math.round(sum / total);
    const passed = score >= 60;
    const xpAward = camp?.xpAward ?? 100;
    const earnedXp = score >= 50 ? Math.round(xpAward * (score / 100)) : 0;
    const durationSec = Math.max(
      0,
      Math.round((Date.now() - session.startedAt.getTime()) / 1000),
    );

    let summary: {
      headline: string;
      summary: string;
      strengths: string[];
      improvements: string[];
    };
    try {
      summary = await this.ai.summarizeCampSession({
        campTitle: camp?.title ?? 'Camp',
        score,
        items: answers.map((a) => ({
          prompt: a.prompt,
          score: a.score,
          format: a.format,
        })),
      });
    } catch (err) {
      this.logger.warn(`Resumo da sessão via IA falhou: ${String(err)}`);
      summary = {
        headline: passed ? 'Boa, soldado!' : 'Sessão concluída',
        summary: `Você marcou ${score}/100 respondendo ${answers.length} de ${total} itens.`,
        strengths: passed ? ['Bom aproveitamento no treino.'] : [],
        improvements: passed
          ? ['Continue treinando para manter o ritmo.']
          : ['Revise os itens com menor nota e refaça o camp.'],
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.campSession.update({
        where: { id: session.id },
        data: {
          status: 'finished',
          score,
          earnedXp,
          finishedAt: new Date(),
          durationSec,
          summary: summary,
        },
      });

      if (earnedXp > 0) {
        await tx.xpEvent.create({
          data: {
            userId,
            type: 'camp_session',
            sourceId: session.campId,
            amount: earnedXp,
            uniqueKey: `camp_${session.id}`,
          },
        });
        await tx.userXp.upsert({
          where: { userId },
          create: { userId, totalXp: earnedXp, weekXp: earnedXp },
          update: {
            totalXp: { increment: earnedXp },
            weekXp: { increment: earnedXp },
          },
        });
      }
    });

    return {
      sessionId: session.id,
      campSlug: camp?.slug,
      score,
      passed,
      earnedXp,
      totalItems: total,
      answered: answers.length,
      durationSec,
      summary,
    };
  }

  async getSession(userId: string, sessionId: string): Promise<any> {
    const session = await this.prisma.campSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        camp: {
          select: { slug: true, title: true, category: true, icon: true },
        },
        answers: { orderBy: { itemIndex: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');

    const items = (session.items as unknown as CampItemSnapshot[]) ?? [];
    return {
      id: session.id,
      camp: session.camp,
      format: session.format,
      mode: session.mode,
      status: session.status,
      score: session.score,
      earnedXp: session.earnedXp,
      totalItems: session.totalItems,
      summary: session.summary,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      durationSec: session.durationSec,
      items: this.sanitize(items),
      answers: session.answers,
    };
  }

  async history(userId: string): Promise<any[]> {
    return this.prisma.campSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 30,
      include: {
        camp: {
          select: { slug: true, title: true, category: true, icon: true },
        },
      },
    });
  }

  // ---------- Helpers ----------

  private distribute(count: number, formats: string[]): number[] {
    const n = formats.length;
    const base = Math.floor(count / n);
    const remainder = count % n;
    return formats.map((_, i) => base + (i < remainder ? 1 : 0));
  }

  private async pickItems(
    camp: { id: string; title: string; category: string },
    format: string,
    need: number,
    difficulty: number,
  ): Promise<CampItemSnapshot[]> {
    if (need <= 0) return [];

    const pool = await this.prisma.campQuestion.findMany({
      where: { campId: camp.id, format, status: 'active' },
    });

    const picked: CampItemSnapshot[] = shuffle(pool)
      .slice(0, need)
      .map((q) => ({
        questionId: q.id,
        format: q.format,
        prompt: q.prompt,
        options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
        difficulty: q.difficulty,
        _correctIndex: q.correctIndex ?? undefined,
        _answerKey: q.answerKey ?? undefined,
        _explanation: q.explanation ?? undefined,
      }));

    const missing = need - picked.length;
    if (missing <= 0) return picked;

    try {
      const generated = await this.ai.generateCampItems({
        campTitle: camp.title,
        category: camp.category,
        format,
        count: missing,
        difficulty,
      });

      for (const g of generated) {
        picked.push({
          format,
          prompt: g.prompt,
          options: g.options,
          difficulty: g.difficulty,
          _correctIndex: g.correctIndex,
          _answerKey: g.answerKey,
          _explanation: g.explanation,
        });
      }

      if (generated.length > 0) {
        await this.prisma.campQuestion.createMany({
          data: generated.map((g) => ({
            campId: camp.id,
            format,
            prompt: g.prompt,
            options: g.options ?? undefined,
            correctIndex: g.correctIndex ?? null,
            answerKey: g.answerKey ?? null,
            explanation: g.explanation ?? null,
            difficulty: g.difficulty,
            tags: [],
          })),
        });
      }
    } catch (err) {
      this.logger.warn(
        `Não foi possível gerar itens de camp (${camp.title}/${format}): ${String(err)}`,
      );
    }

    return picked;
  }

  private sanitize(items: CampItemSnapshot[]): Array<{
    index: number;
    format: string;
    prompt: string;
    options?: string[];
    difficulty: number;
  }> {
    return items.map((item, index) => ({
      index,
      format: item.format,
      prompt: item.prompt,
      options: item.options,
      difficulty: item.difficulty,
    }));
  }

  private heuristicGrade(
    answer: string,
    answerKey?: string,
  ): { correct: boolean; score: number; feedback: string } {
    const key = (answerKey ?? '').toLowerCase();
    const keywords = key.split(/\W+/).filter((w) => w.length > 4);
    let score: number;
    if (keywords.length === 0) {
      score = Math.min(
        100,
        Math.max(30, Math.round((answer.length / 200) * 100)),
      );
    } else {
      const lower = answer.toLowerCase();
      const hits = keywords.filter((w) => lower.includes(w)).length;
      score = Math.min(
        100,
        Math.max(20, Math.round((hits / keywords.length) * 100)),
      );
    }
    return {
      correct: score >= 60,
      score,
      feedback:
        'Correção automática indisponível agora; avaliamos por correspondência com o gabarito. Refine a resposta para melhorar a nota.',
    };
  }
}
