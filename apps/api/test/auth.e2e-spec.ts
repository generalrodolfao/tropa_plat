import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra, faz login, ganha XP, rotaciona refresh e emite certificado', async () => {
    const email = `test-${Date.now()}@tropa.com`;
    const password = 'senha-segura-123';
    const server = app.getHttpServer();

    // register
    const reg = await request(server)
      .post('/v1/auth/register')
      .send({ email, name: 'Teste', password })
      .expect(201);
    const regBody = reg.body as { accessToken: string; user: { id: string } };
    expect(regBody.accessToken).toBeTruthy();

    // login
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const loginBody = login.body as {
      accessToken: string;
      refreshToken: string;
    };
    const token = loginBody.accessToken;

    // me
    const me = await request(server)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((me.body as { email: string }).email).toBe(email);

    // gamification summary
    const xp = await request(server)
      .get('/v1/gamification/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((xp.body as { rank: string }).rank).toBe('Recruta');

    // refresh rotation
    const refresh = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(201);

    // reuso do refresh antigo deve falhar (rotação)
    await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(401);

    expect(refresh.body.accessToken).toBeTruthy();

    // leitura de ebook + certificado
    const lib = await request(server)
      .get('/v1/library')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const ebook = (lib.body as { ebooks: { id: string }[] }).ebooks[0];
    const prog = await request(server)
      .post('/v1/library/progress')
      .set('Authorization', `Bearer ${token}`)
      .send({ ebookId: ebook.id, readPages: 9999 })
      .expect(201);
    expect((prog.body as { status: string }).status).toBe('concluido');

    const certs = await request(server)
      .get('/v1/library/certificates')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((certs.body as { serial: string }[])[0].serial).toContain(
      'TDD-READ',
    );

    // limpeza
    await prisma.user.delete({ where: { id: regBody.user.id } });
  }, 30000);
});
