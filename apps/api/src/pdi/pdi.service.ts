import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto, UpdateSkillScoreDto } from './dto/pdi.dto';

@Injectable()
export class PDIService {
  private readonly logger = new Logger(PDIService.name);

  // IRT 3-PL model parameters
  private readonly irtA = 1.0  // discrimination
  private readonly irtC = 0.25 // pseudo-guessing

  constructor(private readonly prisma: PrismaService) {}

  // ---------- IRT: Probability of correct response ----------

  private irtProbability(theta: number, difficulty: number, discrimination = this.irtA): number {
    const exponent = -discrimination * (theta - difficulty)
    return this.irtC + (1 - this.irtC) / (1 + Math.exp(exponent))
  }

  // ---------- IRT: Update ability estimate ----------

  private updateAbility(
    currentTheta: number,
    responses: Array<{ correct: boolean; difficulty: number }>,
  ): number {
    let theta = currentTheta
    const learningRate = 0.3

    for (const { correct, difficulty } of responses) {
      const expected = this.irtProbability(theta, difficulty)
      const actual = correct ? 1 : 0
      const info = this.irtProbability(theta, difficulty) * (1 - this.irtProbability(theta, difficulty))
      const infoSafe = Math.max(info, 0.01)

      // Fisher information weighted update
      theta += learningRate * (actual - expected) * infoSafe * (this.irtA ** 2)
    }

    // Clamp theta to reasonable range [-3, 5]
    return Math.max(-3, Math.min(5, theta))
  }

  // ---------- Theta to skill level ----------

  private thetaToLevel(theta: number): number {
    // Map theta to 0-5 scale
    // theta -3 = level 0, theta 5 = level 5
    const level = Math.round(((theta + 3) / 8) * 5)
    return Math.max(0, Math.min(5, level))
  }

  // ---------- Get skill scores ----------

  async getSkillScores(userId: string) {
    const scores = await this.prisma.skillScore.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { lastAssessedAt: 'desc' },
    })

    return scores.map((s: any) => ({
      skillId: s.skillId,
      skillName: s.skill.name,
      level: s.level,
      confidence: s.confidence,
      lastAssessed: s.lastAssessedAt,
      source: s.source,
    }))
  }

  // ---------- Submit quiz attempt with IRT scoring ----------

  async submitQuizAttempt(userId: string, dto: SubmitQuizDto) {
    // Get questions
    const questionIds = dto.answers.map((a) => a.questionId)
    const questions = await this.prisma.quizQuestion.findMany({
      where: { id: { in: questionIds } },
    })

    if (questions.length !== dto.answers.length) {
      throw new NotFoundException('Algumas questões não foram encontradas')
    }

    // Build responses with IRT
    const responses = dto.answers.map((answer) => {
      const question = questions.find((q: any) => q.id === answer.questionId)
      const correct = question ? answer.selectedIndex === question.correctIndex : false
      const difficulty = question?.difficulty ?? 2
      return { correct, difficulty }
    })

    // Get current skill score or create
    let skillScore = await this.prisma.skillScore.findUnique({
      where: { userId_skillId: { userId, skillId: dto.skillId } },
    })

    // Get current theta from confidence field (storing theta there)
    const currentTheta = skillScore?.confidence ?? 0
    const newTheta = this.updateAbility(currentTheta, responses)
    const newLevel = this.thetaToLevel(newTheta)

    const correctCount = responses.filter((r) => r.correct).length
    const score = Math.round((correctCount / responses.length) * 100)

    // Upsert skill score
    if (skillScore) {
      await this.prisma.skillScore.update({
        where: { id: skillScore.id },
        data: {
          confidence: newTheta,
          level: newLevel,
          lastAssessedAt: new Date(),
        },
      })
    } else {
      await this.prisma.skillScore.create({
        data: {
          userId,
          skillId: dto.skillId,
          confidence: newTheta,
          level: newLevel,
          source: 'quiz',
        },
      })
    }

    // Create attempt record (simplified - without skillId since model doesn't have it)
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId: dto.skillId, // Using skillId as quizId reference
        userId,
        score,
        earnedXp: Math.round(score / 10),
        adaptiveState: {
          thetaBefore: currentTheta,
          thetaAfter: newTheta,
          levelBefore: skillScore?.level ?? 0,
          levelAfter: newLevel,
        },
      },
    })

    return {
      attemptId: attempt.id,
      score,
      correctCount,
      totalQuestions: responses.length,
      theta: { before: currentTheta, after: newTheta },
      level: { before: skillScore?.level ?? 0, after: newLevel },
    }
  }

  // ---------- Get journey graph ----------

  async getJourneyGraph(userId: string) {
    const scores = await this.prisma.skillScore.findMany({
      where: { userId },
      include: { skill: true },
    })

    const skills = scores.map((s: any) => ({
      skillId: s.skillId,
      name: s.skill.name,
      level: s.level,
      confidence: s.confidence,
      targetLevel: 5,
    }))

    // Calculate overall progress
    const totalSkills = skills.length
    const avgLevel = totalSkills > 0
      ? skills.reduce((sum: number, s: any) => sum + s.level, 0) / totalSkills
      : 0

    return {
      skills,
      overall: {
        totalSkills,
        averageLevel: Math.round(avgLevel * 10) / 10,
      },
    }
  }

  // ---------- Update skill score (manual/admin) ----------

  async updateSkillScore(userId: string, dto: UpdateSkillScoreDto) {
    const theta = (dto.level / 5) * 8 - 3 // Convert level to theta

    return this.prisma.skillScore.upsert({
      where: { userId_skillId: { userId, skillId: dto.skillId } },
      update: {
        level: dto.level,
        confidence: theta,
        source: dto.source ?? 'manual',
        lastAssessedAt: new Date(),
      },
      create: {
        userId,
        skillId: dto.skillId,
        level: dto.level,
        confidence: theta,
        source: dto.source ?? 'manual',
      },
    })
  }
}
