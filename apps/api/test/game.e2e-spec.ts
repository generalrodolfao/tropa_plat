import request from 'supertest';
import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import {
  bootstrapApp,
  registerUser,
  TestContext,
} from './helpers/bootstrap-app';

function base64UrlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

describe('Game SSO (v1/game/sso)', () => {
  let ctx: TestContext;
  let gameUrl: string;
  let gameSecret: string;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    const config = ctx.app.get(ConfigService);
    gameUrl = config.getOrThrow<string>('GAME_URL');
    gameSecret = config.getOrThrow<string>('GAME_SSO_SECRET');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('401 sem token de acesso da plataforma', async () => {
    await request(ctx.server).get('/v1/game/sso').expect(401);
  });

  it('gera url de entrada com token SSO HS256 válido para o usuário logado', async () => {
    const user = await registerUser(ctx.server, 'game');
    const res = await request(ctx.server)
      .get('/v1/game/sso')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    const url = (res.body as { url: string }).url;
    const expectedPrefix = `${gameUrl.replace(/\/+$/, '')}/?sso=`;
    expect(url.startsWith(expectedPrefix)).toBe(true);

    const token = decodeURIComponent(url.slice(expectedPrefix.length));
    const [h, p, sig] = token.split('.');
    expect(h && p && sig).toBeTruthy();

    const payload = JSON.parse(base64UrlDecode(p).toString()) as Record<
      string,
      unknown
    >;
    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.name).toBe('game');
    expect(payload.aud).toBe('vale-dos-dados');
    expect(payload.jti).toBeTruthy();
    expect(payload.exp).toBeTruthy();
    // 5 minutos de vida
    const life = (payload.exp as number) - Math.floor(Date.now() / 1000);
    expect(life).toBeGreaterThan(4 * 60);
    expect(life).toBeLessThanOrEqual(5 * 60);

    // assinatura válida com GAME_SSO_SECRET (HS256)
    const expectedSig = createHmac('sha256', gameSecret)
      .update(`${h}.${p}`)
      .digest('base64url');
    expect(sig).toBe(expectedSig);
  });

  it('gera um jti novo a cada acesso', async () => {
    const user = await registerUser(ctx.server, 'game2');
    const a = await request(ctx.server)
      .get('/v1/game/sso')
      .set('Authorization', `Bearer ${user.token}`);
    const b = await request(ctx.server)
      .get('/v1/game/sso')
      .set('Authorization', `Bearer ${user.token}`);
    const jtiOf = (url: string): string =>
      (
        JSON.parse(
          base64UrlDecode(url.split('sso=')[1].split('.')[1]).toString(),
        ) as { jti: string }
      ).jti;
    expect(jtiOf((a.body as { url: string }).url)).not.toBe(
      jtiOf((b.body as { url: string }).url),
    );
  });
});
