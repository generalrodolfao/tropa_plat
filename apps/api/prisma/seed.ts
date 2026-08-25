import { PrismaClient, SandboxEngine, LessonType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Tropa dos Dados...');

  // ---- Usuário demo ----
  const demoEmail = 'demo@tropadosdados.com';
  let demo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    demo = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Rodolfo Demo',
        passwordHash: await argon2.hash('tropa-demo-123', {
          type: argon2.argon2id,
        }),
        profile: {
          create: {
            headline: 'Analista de Dados em formação',
            timezone: 'America/Sao_Paulo',
          },
        },
        userXp: { create: { totalXp: 1240, weekXp: 620 } },
        streak: { create: { current: 6, longest: 12 } },
      },
    });
    console.log(`Usuário demo criado: ${demoEmail} / tropa-demo-123`);
  }
  await prisma.userRole.deleteMany({ where: { userId: demo.id } });
  await prisma.userRole.createMany({
    data: [
      { userId: demo.id, role: 'student' },
      { userId: demo.id, role: 'mentor' },
    ],
  });

  // ---- Usuário admin (para testes e operação) ----
  const adminEmail = 'admin@tropadosdados.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin Tropa',
        passwordHash: await argon2.hash('admin-tropa-123', { type: argon2.argon2id }),
        profile: { create: { headline: 'Administrador', timezone: 'America/Sao_Paulo' } },
        userXp: { create: { totalXp: 0, weekXp: 0 } },
        streak: { create: { current: 0, longest: 0 } },
      },
    });
    console.log(`Usuário admin criado: ${adminEmail} / admin-tropa-123`);
  }
  await prisma.userRole.deleteMany({ where: { userId: admin.id } });
  await prisma.userRole.createMany({
    data: [
      { userId: admin.id, role: 'student' },
      { userId: admin.id, role: 'admin' },
    ],
  });

  // ---- Limpeza de dados seedáveis (idempotência) ----
  await prisma.lessonProgress.deleteMany({ where: { userId: demo.id } });
  await prisma.readingProgress.deleteMany({ where: { userId: demo.id } });
  await prisma.jobApplication.deleteMany({ where: { userId: demo.id } });
  await prisma.hackathonTeamMember.deleteMany({ where: { userId: demo.id } });
  await prisma.certificate.deleteMany({ where: { userId: demo.id } });
  await prisma.leagueRanking.deleteMany({ where: { userId: demo.id } });
  await prisma.hackathonSubmission.deleteMany({ where: { userId: demo.id } });
  await prisma.lesson.deleteMany({
    where: { module: { course: { slug: 'sql-fundamentos' } } },
  });
  await prisma.sandbox.deleteMany({ where: { lessonId: null } });
  await prisma.module.deleteMany({
    where: { course: { slug: 'sql-fundamentos' } },
  });
  await prisma.course.deleteMany({ where: { slug: 'sql-fundamentos' } });
  await prisma.league.deleteMany({});
  await prisma.hackathon.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.organization.deleteMany({});

  // ---- Skills ----
  const skillDefs = [
    { name: 'SQL', slug: 'sql', category: 'sql' },
    { name: 'Python', slug: 'python', category: 'python' },
    { name: 'Estatística', slug: 'estatistica', category: 'estatistica' },
    { name: 'Visualização', slug: 'visualizacao', category: 'excel' },
    { name: 'Excel', slug: 'excel', category: 'excel' },
    { name: 'ML Básico', slug: 'ml-basico', category: 'ml' },
  ];
  const skills: Record<string, { id: string }> = {};
  for (const s of skillDefs) {
    skills[s.slug] = await prisma.skillTaxonomy.upsert({
      where: { slug: s.slug },
      create: s,
      update: {},
    });
  }

  // ---- Curso SQL — Fundamentos ----
  const sqlCourse = await prisma.course.upsert({
    where: { slug: 'sql-fundamentos' },
    create: {
      slug: 'sql-fundamentos',
      title: 'SQL — Fundamentos de Operação',
      description:
        'Do zero até consultas de produção: SELECT, filtros, joins, agregação e window functions.',
      level: 'iniciante',
      status: 'published',
      publishedAt: new Date(),
      xpTotal: 2400,
    },
    update: {},
  });

  const modules = [
    {
      title: 'O Preparo',
      codename: 'PREP',
      type: 'watch',
      lessons: [
        {
          title: 'Boas-vindas à Tropa',
          type: 'video' as LessonType,
          xpAward: 100,
          durationSec: 420,
          content: { videoUrl: 'https://stream.cloudflare.com/demo' },
        },
        {
          title: 'O que é um banco relacional',
          type: 'video' as LessonType,
          xpAward: 120,
          durationSec: 540,
        },
        {
          title: 'SELECT: seus primeiros dados',
          type: 'sandbox' as LessonType,
          xpAward: 150,
          durationSec: 900,
        },
      ],
    },
    {
      title: 'Filtros e Operações',
      codename: 'FILTROS',
      type: 'do',
      lessons: [
        {
          title: 'WHERE e operadores lógicos',
          type: 'video' as LessonType,
          xpAward: 130,
          durationSec: 600,
        },
        {
          title: 'Sandbox: limpando o terreno',
          type: 'sandbox' as LessonType,
          xpAward: 180,
          durationSec: 1200,
        },
        {
          title: 'Quiz de WHERE',
          type: 'quiz' as LessonType,
          xpAward: 90,
          durationSec: 300,
        },
      ],
    },
    {
      title: 'Relacionamentos',
      codename: 'JOINS',
      type: 'do',
      lessons: [
        {
          title: 'JOINs: juntando tabelas',
          type: 'video' as LessonType,
          xpAward: 140,
          durationSec: 660,
        },
        {
          title: 'Projeto: análise de vendas',
          type: 'project' as LessonType,
          xpAward: 400,
          durationSec: 0,
        },
      ],
    },
    {
      title: 'Guerra de Dados',
      codename: 'GUERRA',
      type: 'play',
      lessons: [
        {
          title: 'Window functions',
          type: 'video' as LessonType,
          xpAward: 160,
          durationSec: 720,
        },
        {
          title: 'Desafio final: a ofensiva',
          type: 'challenge' as LessonType,
          xpAward: 500,
          durationSec: 0,
        },
      ],
    },
  ];

  for (const [mi, m] of modules.entries()) {
    const mod = await prisma.module.create({
      data: {
        courseId: sqlCourse.id,
        title: m.title,
        codename: m.codename,
        type: m.type,
        position: mi + 1,
        estimatedMinutes: m.lessons.reduce(
          (a, l) => a + Math.ceil(l.durationSec / 60),
          0,
        ),
        xpAward: m.lessons.reduce((a, l) => a + l.xpAward, 0),
      },
    });
    for (const [li, l] of m.lessons.entries()) {
      await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          title: l.title,
          type: l.type,
          position: li + 1,
          durationSec: l.durationSec,
          xpAward: l.xpAward,
          content: l.content,
        },
      });
    }
  }

  // ---- Sandbox anexado à primeira aula ----
  const firstLesson = await prisma.lesson.findFirst({
    where: { module: { courseId: sqlCourse.id }, type: 'sandbox' },
  });
  if (firstLesson) {
    const sandbox = await prisma.sandbox.create({
      data: {
        lessonId: firstLesson.id,
        title: 'Sandbox SQL — SELECT e WHERE',
        engine: SandboxEngine.sql,
        difficulty: 2,
        xpAward: 150,
        spec: {
          prompt:
            'Escreva um SELECT com WHERE para filtrar clientes do estado de SP.',
          datasets: ['clientes'],
          hiddenTests: ['SELECT', 'WHERE', "='SP'"],
        },
      },
    });
    await prisma.dataset.upsert({
      where: { name: 'clientes' },
      create: {
        name: 'clientes',
        storageKey: 'datasets/clientes.csv',
        format: 'csv',
        rows: 1000,
      },
      update: {},
    });
    await prisma.sandboxDataset.create({
      data: {
        sandboxId: sandbox.id,
        datasetId: (await prisma.dataset.findUnique({
          where: { name: 'clientes' },
        }))!.id,
      },
    });
  }

  // ---- Ebooks ----
  const ebooks = [
    {
      slug: 'sql-descomplicado',
      title: 'SQL Descomplicado',
      author: 'Rodolfo Almeida',
      category: 'SQL & Bancos',
      pages: 86,
    },
    {
      slug: 'excel-analista',
      title: 'Excel de Analista de Dados',
      author: 'Rodolfo Almeida',
      category: 'Excel & BI',
      pages: 72,
    },
    {
      slug: 'estatistica-aplicada',
      title: 'Estatística Aplicada a Dados',
      author: 'Rodolfo Almeida',
      category: 'Estatística & ML',
      pages: 95,
    },
    {
      slug: 'python-para-dados',
      title: 'Python para Análise de Dados',
      author: 'Mariana Costa',
      category: 'Python & Dados',
      pages: 110,
    },
  ];
  for (const b of ebooks) {
    await prisma.ebook.upsert({
      where: { slug: b.slug },
      create: b,
      update: {},
    });
  }

  // ---- Vagas ----
  const org = await prisma.organization.create({
    data: {
      name: 'Tropa Recrutamento',
      type: 'company',
      billingEmail: 'rh@tropa',
    },
  });

  const jobs = [
    {
      organizationId: org.id,
      title: 'Analista de Dados Pleno',
      location: 'São Paulo, SP',
      workMode: 'Híbrido',
      salaryMin: 8500,
      salaryMax: 10500,
      seniority: 'Pleno',
      skills: [
        { name: 'SQL', level: 3 },
        { name: 'Python', level: 2 },
        { name: 'Metabase', level: 1 },
      ],
    },
    {
      organizationId: org.id,
      title: 'Analista de BI',
      location: 'Remoto',
      workMode: 'Remoto',
      salaryMin: 6200,
      salaryMax: 8200,
      seniority: 'Júnior',
      skills: [
        { name: 'SQL', level: 2 },
        { name: 'Excel', level: 3 },
        { name: 'Power BI', level: 2 },
      ],
    },
    {
      organizationId: org.id,
      title: 'Engenheiro de Dados Jr.',
      location: 'Osasco, SP',
      workMode: 'Híbrido',
      salaryMin: 7000,
      salaryMax: 9000,
      seniority: 'Júnior',
      skills: [
        { name: 'Python', level: 2 },
        { name: 'SQL', level: 2 },
        { name: 'Airflow', level: 1 },
      ],
    },
    {
      organizationId: org.id,
      title: 'Cientista de Dados',
      location: 'Remoto',
      workMode: 'Remoto',
      salaryMin: 11000,
      salaryMax: 13500,
      seniority: 'Sênior',
      skills: [
        { name: 'ML', level: 3 },
        { name: 'Python', level: 3 },
        { name: 'Estatística', level: 3 },
      ],
    },
  ];
  for (const j of jobs) {
    await prisma.job.create({ data: j });
  }

  // ---- Hackathon ----
  const hackathon = await prisma.hackathon.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Previsão de churn',
      theme: 'Telecom · dataset de 50 mil linhas',
      status: 'running',
      startAt: new Date(),
      endAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      prizePoolCents: 500000,
      maxTeamSize: 4,
      rulesMd:
        'Monte um modelo que preveja quais clientes vão cancelar o plano no próximo trimestre.',
      prizes: {
        create: [
          { position: 1, amountCents: 300000, description: '1º lugar' },
          { position: 2, amountCents: 150000, description: '2º lugar' },
          { position: 3, amountCents: 50000, description: '3º lugar' },
        ],
      },
    },
    update: {},
  });

  const team = await prisma.hackathonTeam.create({
    data: {
      hackathonId: hackathon.id,
      name: 'Esquadrão SQL',
      leaderUserId: demo.id,
      members: { create: [{ userId: demo.id, role: 'leader' }] },
    },
  });

  // ---- Liga da semana ----
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));

  const botUsers = [
    { id: '00000000-0000-0000-0000-000000000002', name: 'Mariana C.' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Rafael T.' },
  ];
  for (const bot of botUsers) {
    await prisma.user.upsert({
      where: { id: bot.id },
      create: {
        id: bot.id,
        email: `${bot.name.toLowerCase().replace(/\W/g, '')}@bots.tropa`,
        name: bot.name,
        passwordHash: await argon2.hash('bot-senha', { type: argon2.argon2id }),
        userXp: { create: { totalXp: 0 } },
      },
      update: {},
    });
  }

  const league = await prisma.league.create({
    data: {
      season: 1,
      weekStart: monday,
      weekEnd: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000),
      cohortSize: 3,
      promotionCount: 1,
      rankings: {
        create: [
          { userId: demo.id, xp: 620, rank: 1, eligiblePromotion: true },
          { userId: botUsers[0].id, xp: 540, rank: 2 },
          { userId: botUsers[1].id, xp: 380, rank: 3 },
        ],
      },
    },
  });

  // ---- Badges (critérios declarativos avaliados pelo worker) ----
  const badgeDefs = [
    {
      code: 'primeiros-passos',
      name: 'Primeiros Passos',
      description: 'Complete a primeira aula',
      icon: '🎯',
      criteria: { type: 'and', ops: [{ xp_total: 100 }] },
    },
    {
      code: 'sargento',
      name: 'Sargento de Dados',
      description: 'Acumule 2.500 XP',
      icon: '🎖️',
      criteria: { type: 'and', ops: [{ xp_total: 2500 }] },
    },
    {
      code: 'maratona',
      name: 'Maratonista',
      description: 'Mantenha uma sequência de 7 dias',
      icon: '🔥',
      criteria: { type: 'and', ops: [{ streak: 7 }] },
    },
  ];
  for (const b of badgeDefs) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: { name: b.name, description: b.description, icon: b.icon, criteria: b.criteria },
    });
  }

  console.log('Seed completo ✔');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
