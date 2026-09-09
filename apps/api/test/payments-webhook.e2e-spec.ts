import request from 'supertest';
import { bootstrapApp, TestContext } from './helpers/bootstrap-app';

describe('Webhook Mercado Pago (e2e)', () => {
  let ctx: TestContext;
  let server: any;

  beforeAll(async () => {
    ctx = await bootstrapApp();
    server = ctx.server;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const eventId = `e2e-${Date.now()}`;

  const webhookBody = (overrides: Record<string, unknown> = {}) => ({
    id: eventId,
    live_mode: false,
    type: 'payment',
    date_created: new Date().toISOString(),
    user_id: '1',
    api_version: 'v1',
    action: 'payment.created',
    data: { id: 'payment-e2e-1' },
    ...overrides,
  });

  it('aceita notificação e grava evento (idempotente)', async () => {
    for (let i = 0; i < 2; i++) {
      const res = await request(server)
        .post('/v1/payments/webhook')
        .send(webhookBody())
        .expect(200);
      expect((res.body as { ok: boolean }).ok).toBe(true);
    }

    const events = await ctx.prisma.webhookEvent.findMany({
      where: { eventId },
    });
    expect(events).toHaveLength(1);
    // Token MP inválido no CI => evento termina em 'failed'; nao pode ficar 'processing'
    expect(['processed', 'failed']).toContain(events[0].status);
  });

  it('não cria evento para tipo desconhecido', async () => {
    const res = await request(server)
      .post('/v1/payments/webhook')
      .send(webhookBody({ id: `${eventId}-unknown`, type: 'example.event' }))
      .expect(200);
    expect((res.body as { ok: boolean }).ok).toBe(true);

    const events = await ctx.prisma.webhookEvent.findMany({
      where: { eventId: `${eventId}-unknown` },
    });
    expect(events).toHaveLength(0);
  });

  afterAll(async () => {
    await ctx.prisma.webhookEvent
      .deleteMany({ where: { eventId: { startsWith: 'e2e-' } } })
      .catch(() => undefined);
  });
});
