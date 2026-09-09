import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitProjectDto, GradeSubmissionDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- List projects ----------

  async listProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      orderBy: { title: 'asc' },
    });

    const submissions = await this.prisma.projectSubmission.findMany({
      where: { userId },
      select: { projectId: true, status: true, score: true },
    });

    const subMap = new Map(submissions.map((s) => [s.projectId, s]));

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      briefMd: project.briefMd,
      evaluationMode: project.evaluationMode,
      xpAward: project.xpAward,
      submission: subMap.get(project.id) ?? null,
    }));
  }

  // ---------- Get project details ----------

  async getProjectDetails(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        submissions: {
          select: {
            id: true,
            userId: true,
            status: true,
            score: true,
            submittedAt: true,
          },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  // ---------- Submit project ----------

  async submitProject(userId: string, dto: SubmitProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Check if already submitted
    const existing = await this.prisma.projectSubmission.findFirst({
      where: { projectId: dto.projectId, userId, status: 'pending' },
    });

    if (existing) {
      throw new ForbiddenException('Você já tem uma submissão pendente');
    }

    // Create submission
    const submission = await this.prisma.projectSubmission.create({
      data: {
        projectId: dto.projectId,
        userId,
        status: 'pending',
      },
    });

    return {
      ok: true,
      submissionId: submission.id,
    };
  }

  // ---------- Grade by mentor ----------

  async gradeSubmission(userId: string, dto: GradeSubmissionDto) {
    // Check if user is admin
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const isAdmin = userRoles.some((r) => r.role === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Apenas admins podem avaliar');
    }

    const submission = await this.prisma.projectSubmission.findUnique({
      where: { id: dto.submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submissão não encontrada');
    }

    // Update with grade
    const updated = await this.prisma.projectSubmission.update({
      where: { id: dto.submissionId },
      data: {
        score: dto.score,
        status: 'graded',
      },
    });

    // Create grade record
    await this.prisma.projectGrade.create({
      data: {
        submissionId: dto.submissionId,
        graderUserId: userId,
        score: dto.score,
        feedbackMd: dto.feedback,
        rubricScores: dto.criteriaScores as any,
      },
    });

    // Award XP to student
    const xpEarned = Math.round(dto.score / 10);
    await this.prisma.projectSubmission.update({
      where: { id: dto.submissionId },
      data: { earnedXp: xpEarned },
    });

    return {
      ok: true,
      submissionId: updated.id,
      score: dto.score,
      xpEarned,
    };
  }

  // ---------- Get submissions for grading ----------

  async getSubmissionsForGrading(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const isAdmin = userRoles.some((r) => r.role === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Apenas admins podem acessar');
    }

    return this.prisma.projectSubmission.findMany({
      where: { status: 'pending' },
      include: {
        project: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  // ---------- Get user submissions ----------

  async getUserSubmissions(userId: string) {
    return this.prisma.projectSubmission.findMany({
      where: { userId },
      include: {
        project: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
