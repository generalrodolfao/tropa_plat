import request from 'supertest';
import {
  bootstrapApp,
  registerUser,
  promoteToAdmin,
  TestContext,
} from './helpers/bootstrap-app';

describe('RBAC e user scoping (e2e)', () => {
  let ctx: TestContext;
  let server: any;
  let admin: Awaited<ReturnType<typeof registerUser>>;
  let student: Awaited<ReturnType<typeof registerUser>>;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    server = ctx.server;
    admin = await registerUser(server, 'rbac-admin');
    student = await registerUser(server, 'rbac-student');
    await promoteToAdmin(ctx.prisma, admin.id);
  });

  afterAll(async () => {
    for (const u of [admin, student]) {
      await ctx.prisma.user
        .delete({ where: { id: u.id } })
        .catch(() => undefined);
    }
    await ctx.app.close();
  });

  describe('auth', () => {
    it('rejeita endpoint protegido sem token', async () => {
      await request(server).get('/v1/users').expect(401);
    });

    it('rejeita token inválido', async () => {
      await request(server)
        .get('/v1/users')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('roles são resolvidas no banco (não no JWT)', () => {
    it('student não acessa rotas admin', async () => {
      await request(server)
        .get('/v1/users')
        .set('Authorization', `Bearer ${student.token}`)
        .expect(403);
      await request(server)
        .get('/v1/payments/admin/subscriptions')
        .set('Authorization', `Bearer ${student.token}`)
        .expect(403);
      await request(server)
        .post('/v1/admin/content/courses')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ slug: 'forbidden', title: 'Forbidden' })
        .expect(403);
    });

    it('token emitido ANTES do promote ganha acesso após promote (DB-backed)', async () => {
      await request(server)
        .get('/v1/users')
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
    });

    it('student pode ler o próprio perfil', async () => {
      const res = await request(server)
        .get(`/v1/users/${student.id}`)
        .set('Authorization', `Bearer ${student.token}`)
        .expect(200);
      expect((res.body as { email: string }).email).toBe(student.email);
    });
  });

  describe('scoping por usuário', () => {
    it('student NÃO acessa perfil de outro usuário', async () => {
      await request(server)
        .get(`/v1/users/${admin.id}`)
        .set('Authorization', `Bearer ${student.token}`)
        .expect(403);
    });

    it('admin acessa perfil de qualquer usuário', async () => {
      const res = await request(server)
        .get(`/v1/users/${student.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200);
      expect((res.body as { email: string }).email).toBe(student.email);
    });
  });
});
