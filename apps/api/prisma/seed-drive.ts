import { PrismaClient, LessonType } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Todas as pastas vistas nos 2 Drives — vão virar Courses temporários (híbrido depois você agrupa no /admin)
const FOLDERS = [
  // Black Ops específico
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
  // Drive geral
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

const DRIVE_LINK = 'https://drive.google.com/drive/folders/1KF3zRnq8Q-WuwwZEMLJhY-s5meTGy3Wk';
const DRIVE_GERAL = 'https://drive.google.com/drive/folders/1_vCMYQjWjGWYFNTmw_Ds2etaIWkDquR-';

async function main() {
  console.log('Seeding Drive → Courses (bulk placeholder)...');
  let created = 0;
  let updated = 0;

  for (const name of FOLDERS) {
    const slug = slugify(name);
    // evita colisão com sql-fundamentos
    if (slug === 'sql-fundamentos') continue;

    const exists = await prisma.course.findUnique({ where: { slug } });
    let course;
    if (exists) {
      course = await prisma.course.update({
        where: { slug },
        data: { title: name, description: `Importado do Drive — pasta "${name}". Vídeos originais em ${DRIVE_LINK}. Placeholder até ingest do Stream/R2.`, level: 'intermediario', status: 'published', publishedAt: new Date() },
      });
      updated++;
    } else {
      course = await prisma.course.create({
        data: {
          slug,
          title: name,
          description: `Importado do Drive — pasta "${name}". Vídeos originais em ${DRIVE_LINK}. Placeholder até ingest do Stream/R2.`,
          level: 'intermediario',
          status: 'published',
          publishedAt: new Date(),
          xpTotal: 600,
        },
      });
      created++;
    }

    // cria 2 módulos placeholders se não existirem
    const modulesCount = await prisma.module.count({ where: { courseId: course.id } });
    if (modulesCount === 0) {
      for (let mi = 0; mi < 2; mi++) {
        const mod = await prisma.module.create({
          data: {
            courseId: course.id,
            title: mi === 0 ? 'Fundamentos' : 'Prática e Projeto',
            codename: mi === 0 ? 'MOD-01' : 'MOD-02',
            type: mi === 0 ? 'watch' : 'do',
            position: mi + 1,
            estimatedMinutes: 45,
            xpAward: 300,
          },
        });
        const lessons = [
          { title: `${name} — Aula 01`, type: 'video' as LessonType, xpAward: 80, durationSec: 900, content: { driveFolder: name, driveLink: DRIVE_LINK, placeholder: true } },
          { title: `${name} — Aula 02`, type: 'video' as LessonType, xpAward: 80, durationSec: 1100, content: { driveFolder: name, driveLink: DRIVE_LINK, placeholder: true } },
          { title: `${name} — Exercício`, type: 'sandbox' as LessonType, xpAward: 120, durationSec: 900, content: { placeholder: true } },
        ];
        for (let li = 0; li < lessons.length; li++) {
          const l = lessons[li];
          await prisma.lesson.create({
            data: {
              moduleId: mod.id,
              title: l.title,
              type: l.type,
              position: li + 1,
              durationSec: l.durationSec,
              xpAward: l.xpAward,
              content: l.content as any,
            },
          });
        }
      }
      // atualiza xpTotal real
      const xpTotal = 600;
      await prisma.course.update({ where: { id: course.id }, data: { xpTotal } });
    }

    // cria 1 ebook placeholder por course (para PDFs futuros)
    const ebookSlug = `ebook-${slug}`;
    await prisma.ebook.upsert({
      where: { slug: ebookSlug },
      create: { slug: ebookSlug, title: `Apostila — ${name}`, category: 'Black Ops', pages: 60, description: `PDFs da pasta "${name}" — subir via R2` },
      update: {},
    });
  }

  console.log(`Seed Drive completo: ${created} cursos criados, ${updated} atualizados, total ${FOLDERS.length}`);
  // mantém sql-fundamentos publicado
  await prisma.course.updateMany({ where: { slug: 'sql-fundamentos' }, data: { status: 'published' } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
