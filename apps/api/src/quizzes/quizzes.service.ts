import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuizDto,
  CreateQuestionDto,
  SubmitAttemptDto,
} from './dto/quizzes.dto';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------- Get Quiz by Lesson ----------

  async getByLessonId(lessonId: string): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          select: {
            id: true,
            prompt: true,
            options: true,
            difficulty: true,
            category: true,
            // NÃO retornar correctIndex para o aluno
          },
        },
      },
    });

    if (!quiz) throw new Error('QUIZ_NOT_FOUND');

    return {
      id: quiz.id,
      mode: quiz.mode,
      passingScore: quiz.passingScore,
      timeLimitSec: quiz.timeLimitSec,
      xpAward: quiz.xpAward,
      maxAttempts: quiz.maxAttempts,
      questions: quiz.questions,
    };
  }

  // ---------- Submit Attempt ----------

  async submitAttempt(
    userId: string,
    quizId: string,
    dto: SubmitAttemptDto,
  ): Promise<{
    attemptId: string;
    score: number;
    passed: boolean;
    earnedXp: number;
    totalQuestions: number;
    correctAnswers: number;
    details: Array<{
      questionId: string;
      correct: boolean;
      correctIndex: number;
      explanation?: string;
    }>;
  }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) throw new Error('QUIZ_NOT_FOUND');

    // Verificar tentativas anteriores
    const previousAttempts = await this.prisma.quizAttempt.count({
      where: { quizId, userId },
    });

    if (previousAttempts >= quiz.maxAttempts) {
      throw new Error('MAX_ATTEMPTS_REACHED');
    }

    // Calcular score
    let correctAnswers = 0;
    const details: Array<{
      questionId: string;
      correct: boolean;
      correctIndex: number;
      explanation?: string;
    }> = [];

    for (const answer of dto.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      const correct = question.correctIndex === answer.chosenIndex;
      if (correct) correctAnswers++;

      details.push({
        questionId: answer.questionId,
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation ?? undefined,
      });
    }

    const totalQuestions = quiz.questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    const passed = score >= quiz.passingScore;

    // Calcular XP ganho
    let earnedXp = 0;
    if (passed) {
      earnedXp = quiz.xpAward;
      // Bônus por velocidade (opcional)
      const avgTimeMs =
        dto.answers.reduce((sum, a) => sum + a.timeMs, 0) / dto.answers.length;
      if (avgTimeMs < 5000) earnedXp = Math.round(earnedXp * 1.2); // 20% bônus se rápido
    }

    // Criar tentativa e respostas em transaction
    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: {
          quizId,
          userId,
          score,
          earnedXp,
          finishedAt: new Date(),
        },
      });

      for (const answer of dto.answers) {
        const question = quiz.questions.find((q) => q.id === answer.questionId);
        if (!question) continue;

        await tx.userQuestionAnswer.create({
          data: {
            attemptId: created.id,
            questionId: answer.questionId,
            chosenIndex: answer.chosenIndex,
            correct: question.correctIndex === answer.chosenIndex,
            timeMs: answer.timeMs,
          },
        });
      }

      // Se passou, dar XP
      if (passed && earnedXp > 0) {
        await tx.xpEvent.create({
          data: {
            userId,
            type: 'quiz_pass',
            sourceId: quizId,
            amount: earnedXp,
            uniqueKey: `quiz_${quizId}_${userId}_${Date.now()}`,
          },
        });

        // Atualizar total XP
        await tx.userXp.upsert({
          where: { userId },
          create: { userId, totalXp: earnedXp, weekXp: earnedXp },
          update: {
            totalXp: { increment: earnedXp },
            weekXp: { increment: earnedXp },
          },
        });
      }

      return created;
    });

    return {
      attemptId: attempt.id,
      score,
      passed,
      earnedXp,
      totalQuestions,
      correctAnswers,
      details,
    };
  }

  // ---------- Get Attempt ----------

  async getAttempt(attemptId: string, userId: string): Promise<any> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                prompt: true,
                options: true,
                correctIndex: true,
                explanation: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new Error('ATTEMPT_NOT_FOUND');

    return attempt;
  }

  // ---------- Admin: Create Quiz ----------

  async createQuiz(dto: CreateQuizDto): Promise<any> {
    // Verificar se a aula já tem quiz
    const existing = await this.prisma.quiz.findUnique({
      where: { lessonId: dto.lessonId },
    });
    if (existing) throw new Error('QUIZ_ALREADY_EXISTS_FOR_LESSON');

    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        mode: 'fixed',
        passingScore: dto.passingScore ?? 60,
        timeLimitSec: dto.timeLimitSec,
        xpAward: dto.xpAward ?? 100,
        maxAttempts: dto.maxAttempts ?? 3,
      },
    });
  }

  // ---------- Admin: Create Question ----------

  async createQuestion(quizId: string, dto: CreateQuestionDto): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new Error('QUIZ_NOT_FOUND');

    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        prompt: dto.prompt,
        options: dto.options,
        correctIndex: dto.correctIndex,
        difficulty: dto.difficulty ?? 3,
        explanation: dto.explanation,
        category: dto.category,
        skillId: dto.skillId,
      },
    });
  }

  // ---------- Admin: List Quizzes ----------

  async listQuizzes(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.quiz.findMany({
        include: {
          lesson: { select: { id: true, title: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lessonId: 'asc' },
      }),
      this.prisma.quiz.count(),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ---------- Admin: Delete Question ----------

  async deleteQuestion(questionId: string): Promise<void> {
    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }
}
