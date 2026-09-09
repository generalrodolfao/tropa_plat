import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filters?: { search?: string; skills?: string[] }) {
    const where: any = { status: 'open' };

    if (filters?.search) {
      where.OR = [{ title: { contains: filters.search, mode: 'insensitive' } }];
    }

    const [jobs, applications, userSkills] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        take: 50,
      }),
      this.prisma.jobApplication.findMany({
        where: { userId },
        select: { jobId: true, status: true, fitScore: true, appliedAt: true },
      }),
      this.prisma.skillScore.findMany({
        where: { userId, level: { gt: 0 } },
        select: { skill: { select: { name: true } }, level: true },
      }),
    ]);

    const skillMap = new Map(
      userSkills.map((s) => [s.skill.name.toLowerCase(), s.level]),
    );
    const applied = new Map(applications.map((a) => [a.jobId, a]));

    return jobs
      .map((job) => {
        const reqSkills = Array.isArray(job.skills)
          ? (job.skills as { name: string; level: number }[])
          : [];

        // Calculate fit score with level consideration
        let totalWeight = 0;
        let matchedWeight = 0;

        for (const req of reqSkills) {
          const userLevel = skillMap.get(req.name.toLowerCase()) ?? 0;
          const weight = req.level || 1;
          totalWeight += weight;
          if (userLevel >= req.level) {
            matchedWeight += weight;
          } else if (userLevel > 0) {
            matchedWeight += (userLevel / req.level) * weight * 0.5;
          }
        }

        const fitScore =
          totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

        const app = applied.get(job.id);

        return {
          id: job.id,
          title: job.title,
          location: job.location,
          workMode: job.workMode,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          seniority: job.seniority,
          skills: reqSkills,
          fitScore,
          applied: app
            ? { status: app.status, appliedAt: app.appliedAt }
            : null,
          postedAt: job.postedAt,
        };
      })
      .sort((a, b) => b.fitScore - a.fitScore);
  }

  async getJobDetails(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Vaga não encontrada');
    }

    return {
      id: job.id,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      seniority: job.seniority,
      skills: job.skills,
      description: job.description,
      requirements: job.requirements,
      postedAt: job.postedAt,
    };
  }

  async apply(userId: string, jobId: string) {
    // Check if already applied
    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } },
    });
    if (existing) {
      return { ok: true, alreadyApplied: true };
    }

    // Get user skills for fit score
    const userSkills = await this.prisma.skillScore.findMany({
      where: { userId, level: { gt: 0 } },
      select: { skill: { select: { name: true } }, level: true },
    });

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Vaga não encontrada');
    }

    const skillMap = new Map(
      userSkills.map((s) => [s.skill.name.toLowerCase(), s.level]),
    );
    const reqSkills = Array.isArray(job.skills)
      ? (job.skills as { name: string; level: number }[])
      : [];

    // Calculate fit score
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const req of reqSkills) {
      const userLevel = skillMap.get(req.name.toLowerCase()) ?? 0;
      const weight = req.level || 1;
      totalWeight += weight;
      if (userLevel >= req.level) {
        matchedWeight += weight;
      } else if (userLevel > 0) {
        matchedWeight += (userLevel / req.level) * weight * 0.5;
      }
    }

    const fitScore =
      totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    // Create application
    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        fitScore,
      },
    });

    return {
      ok: true,
      applicationId: application.id,
      fitScore,
    };
  }

  async getMyApplications(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            workMode: true,
            seniority: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }
}
