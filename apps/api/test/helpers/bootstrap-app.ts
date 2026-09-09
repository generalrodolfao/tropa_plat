import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  server: any;
}

export async function bootstrapApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication(new FastifyAdapter());
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(0);
  return {
    app,
    prisma: moduleRef.get(PrismaService),
    server: app.getHttpServer(),
  };
}

export const uniqueEmail = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@tropa.com`;

export interface RegisteredUser {
  id: string;
  email: string;
  password: string;
  token: string;
  refreshToken: string;
}

export async function registerUser(
  server: any,
  name: string,
): Promise<RegisteredUser> {
  const email = uniqueEmail(name);
  const password = 'senha-segura-123';
  const res = await request(server)
    .post('/v1/auth/register')
    .send({ email, name, password })
    .expect(201);
  return {
    id: (res.body as { user: { id: string } }).user.id,
    email,
    password,
    token: (res.body as { accessToken: string }).accessToken,
    refreshToken: (res.body as { refreshToken: string }).refreshToken,
  };
}

export async function promoteToAdmin(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  await prisma.userRole.create({ data: { userId, role: 'admin' } });
}
