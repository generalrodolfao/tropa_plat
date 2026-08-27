import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LessonType } from '@prisma/client';

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

const FOLDERS = [
  '2025-11 - APIs WhatsApp e Automação',
  '2025-12 - CI-CD',
  '2025-12 - Docker e Containers',
  '2026-06 - Agentes Corporativos com RAG',
  '2026-06 - Benchmark de LLMS - Otimização de Custo',
  '2026-07 - Missão Blindagem de Vibe Coding + Segurança para I.A',
  '2026-07 - Vibe Payment - Meios de pagamentos para vibe coding',
  '2026-01 - Data Squad',
  '2026-01 - ETL DW Black Ops com Airflow',
  '2026-02 - Docker',
  '2026-04 - Aulão DataBricks',
  '2026-04 - AWS',
  '2026-04 - Google Cloud Platform',
  '2026-05 - Aula Especial Marcela Gallo',
  '2026-05 - Aulão Produtos com IA',
  '2026-06 - Agente IA com ERP',
  '2026-07 - Aulão Dashboard + MCP + Opencode',
  '2026-07 - Vibes on The Air! Deploy de I.A / VibeCoding',
  'BlackOps: Analise De Dados em 2026! - 2026/08/12',
  'BlackOPS: IA além do ChatGPT - 2026/08/05',
  '_outros',
  'Aspirante em Dados (2024)',
  'Aulas Especiais',
  'Cloud Fundamentos (2026-03)',
  'Dados & Containers (2025-11)',
  'data revolution',
  'Domingão do Claudão (2026-05)',
  'Introdução à Análise de Dados (2023)',
  'Mentorias Data Squad',
  'Mini Curso Nekt (2025-09)',
  'Modernização de Dados (2025-08)',
  'Vibe Data Engineering (2026-04)',
];

@ApiTags('admin-seed')
@Controller('admin/seed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSeedController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('promote')
  async promote(@CurrentUser() user: { userId: string }) {
    await this.prisma.userRole.upsert({
      where: { userId_role_organizationId: { userId: user.userId, role: 'admin', organizationId: '' } as any },
      create: { userId: user.userId, role: 'admin' as any },
      update: {},
    }).catch(async () => {
      // fallback para schema com unique diferente
      const exists = await this.prisma.userRole.findFirst({ where: { userId: user.userId, role: 'admin' as any } });
      if (!exists) await this.prisma.userRole.create({ data: { userId: user.userId, role: 'admin' as any } });
    });
    return { ok: true, promoted: user.userId };
  }

  @Post('drive')
  async seedDrive() {
    let created = 0;
    let updated = 0;
    const driveLink = 'https://drive.google.com/drive/folders/1KF3zRnq8Q-WuwwZEMLJhY-s5meTGy3Wk';
    for (const name of FOLDERS) {
      const slug = slugify(name);
      if (slug === 'sql-fundamentos') continue;
      const exists = await this.prisma.course.findUnique({ where: { slug } });
      let course;
      if (exists) {
        course = await this.prisma.course.update({
          where: { slug },
          data: { title: name, description: `Importado do Drive — pasta "${name}". Placeholder até ingest Stream/R2.`, level: 'intermediario', status: 'published', publishedAt: new Date() },
        });
        updated++;
      } else {
        course = await this.prisma.course.create({
          data: { slug, title: name, description: `Importado do Drive — pasta "${name}". Placeholder até ingest Stream/R2.`, level: 'intermediario', status: 'published', publishedAt: new Date(), xpTotal: 600 },
        });
        created++;
      }
      const modulesCount = await this.prisma.module.count({ where: { courseId: course.id } });
      if (modulesCount === 0) {
        for (let mi = 0; mi < 2; mi++) {
          const mod = await this.prisma.module.create({
            data: { courseId: course.id, title: mi === 0 ? 'Fundamentos' : 'Prática e Projeto', codename: mi === 0 ? 'MOD-01' : 'MOD-02', type: mi === 0 ? 'watch' : 'do', position: mi + 1, estimatedMinutes: 45, xpAward: 300 },
          });
          const lessons = [
            { title: `${name} — Aula 01`, type: 'video' as LessonType, xpAward: 80, durationSec: 900, content: { driveFolder: name, driveLink, placeholder: true } },
            { title: `${name} — Aula 02`, type: 'video' as LessonType, xpAward: 80, durationSec: 1100, content: { driveFolder: name, driveLink, placeholder: true } },
            { title: `${name} — Exercício`, type: 'sandbox' as LessonType, xpAward: 120, durationSec: 900, content: { placeholder: true } },
          ];
          for (let li = 0; li < lessons.length; li++) {
            const l = lessons[li];
            await this.prisma.lesson.create({ data: { moduleId: mod.id, title: l.title, type: l.type, position: li + 1, durationSec: l.durationSec, xpAward: l.xpAward, content: l.content as any } });
          }
        }
      }
      const ebookSlug = `ebook-${slug}`;
      await this.prisma.ebook.upsert({ where: { slug: ebookSlug }, create: { slug: ebookSlug, title: `Apostila — ${name}`, category: 'Black Ops', pages: 60, description: `PDFs da pasta "${name}"` }, update: {} });
    }
    return { created, updated, total: FOLDERS.length };
  }
}
