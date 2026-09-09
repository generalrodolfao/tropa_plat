import request from 'supertest';
import {
  bootstrapApp,
  registerUser,
  promoteToAdmin,
  TestContext,
} from './helpers/bootstrap-app';

describe('Content admin e ciclo de publicação (e2e)', () => {
  let ctx: TestContext;
  let server: any;
  let admin: Awaited<ReturnType<typeof registerUser>>;
  let student: Awaited<ReturnType<typeof registerUser>>;

  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let ebookId: string;

  const slug = `e2e-curso-${Date.now().toString(36)}`;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    server = ctx.server;
    admin = await registerUser(server, 'content-admin');
    student = await registerUser(server, 'content-student');
    await promoteToAdmin(ctx.prisma, admin.id);
  });

  afterAll(async () => {
    if (courseId)
      await ctx.prisma.course
        .delete({ where: { id: courseId } })
        .catch(() => undefined);
    if (ebookId)
      await ctx.prisma.ebook
        .delete({ where: { id: ebookId } })
        .catch(() => undefined);
    for (const u of [admin, student]) {
      await ctx.prisma.user
        .delete({ where: { id: u.id } })
        .catch(() => undefined);
    }
    await ctx.app.close();
  });

  it('student não consegue criar conteúdo', async () => {
    await request(server)
      .post('/v1/admin/content/courses')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ slug: `${slug}-nope`, title: 'Nope' })
      .expect(403);
  });

  it('admin cria curso, módulo, lição e ebook', async () => {
    const course = await request(server)
      .post('/v1/admin/content/courses')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        slug,
        title: `Curso e2e ${slug}`,
        description: 'Curso gerado em teste e2e',
        level: 'avancado',
      })
      .expect(201);
    courseId = (course.body as { id: string }).id;
    expect(courseId).toBeTruthy();

    const mod = await request(server)
      .post(`/v1/admin/content/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: `Módulo e2e ${slug}`, codename: 'E2E-01', type: 'watch' })
      .expect(201);
    moduleId = (mod.body as { id: string }).id;
    expect(moduleId).toBeTruthy();

    const lesson = await request(server)
      .post(`/v1/admin/content/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: `Lição e2e ${slug}`,
        type: 'article',
        xpAward: 50,
        content: { body: '# Introdução e2e' },
      })
      .expect(201);
    lessonId = (lesson.body as { id: string }).id;
    expect(lessonId).toBeTruthy();

    const ebook = await request(server)
      .post('/v1/admin/content/ebooks')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        slug: `${slug}-ebook`,
        title: `Ebook e2e ${slug}`,
        category: 'e2e',
        pages: 42,
      })
      .expect(201);
    ebookId = (ebook.body as { id: string }).id;
    expect(ebookId).toBeTruthy();
  });

  it('admin atualiza lição', async () => {
    const res = await request(server)
      .patch(`/v1/admin/content/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: `Lição e2e ${slug} (atualizada)` })
      .expect(200);
    expect((res.body as { title: string }).title).toContain('atualizada');
  });

  it('conteúdo criado aparece publicamente', async () => {
    const list = await request(server).get('/v1/content/courses').expect(200);
    const slugs = (list.body as { slug: string }[]).map((c) => c.slug);
    expect(slugs).toContain(slug);

    const lesson = await request(server)
      .get(`/v1/content/lessons/${lessonId}`)
      .expect(200);
    expect((lesson.body as { title: string }).title).toContain('atualizada');
  });
});
