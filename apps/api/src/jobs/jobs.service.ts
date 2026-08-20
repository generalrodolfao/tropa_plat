import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [jobs, applications] = await Promise.all([
      this.prisma.job.findMany({
        where: { status: 'open' },
        orderBy: { postedAt: 'desc' },
      }),
      this.prisma.jobApplication.findMany({
        where: { userId },
        select: { jobId: true, status: true, fitScore: true },
      }),
    ]);

    const mySkills = await this.prisma.skillScore.findMany({
      where: { userId, level: { gt: 0 } },
      select: { skill: { select: { name: true } }, level: true },
    });
    const skillNames = new Set(mySkills.map((s) => s.skill.name.toLowerCase()));

    const applied = new Map(applications.map((a) => [a.jobId, a]));

    return jobs.map((job) => {
      const reqSkills = Array.isArray(job.skills)
        ? (job.skills as { name: string; level: number }[]).map((s) => s.name)
        : [];
      const match = reqSkills.filter((s) =>
        skillNames.has(s.toLowerCase()),
      ).length;
      const fitScore = reqSkills.length
        ? Math.round((match / reqSkills.length) * 100)
        : 0;

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
        applied: applied.get(job.id) ?? null,
      };
    });
  }

  async apply(userId: string, jobId: string) {
    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_userId: { jobId, userId } },
    });
    if (existing) return { ok: true, alreadyApplied: true };

    const fitScore = 0; // será calculado no job async quando CV revisado existir
    await this.prisma.jobApplication.create({
      data: { jobId, userId, fitScore },
    });
    return { ok: true };
  }
}
