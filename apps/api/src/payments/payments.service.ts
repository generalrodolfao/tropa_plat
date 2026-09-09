import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoAdapter } from './mercadopago.adapter';
import { CreateCheckoutDto, ApplyCouponDto, CreatePlanDto } from './dto/payments.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoAdapter,
  ) {}

  // ---------- Checkout ----------

  async checkout(userId: string, dto: CreateCheckoutDto): Promise<{ checkoutUrl?: string; subscriptionId: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.active) throw new Error('PLAN_NOT_FOUND');

    // Verificar se já tem assinatura ativa
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['trialing', 'active'] } },
    });
    if (existingSub) throw new Error('ACTIVE_SUBSCRIPTION_EXISTS');

    // Buscar ou criar customer no MP
    let customerId: string;
    const existingCustomer = await this.prisma.subscription.findFirst({
      where: { userId },
      select: { providerSubscriptionId: true },
    });

    // Criar customer via MP
    const mpCustomer = await this.mp.createCustomer({
      email: user.email,
      name: user.name,
      externalReference: userId,
    });
    customerId = mpCustomer.id;

    // Criar plano no MP se não existir provider_plan_id
    const mpPlan = await this.mp.createPlan({
      name: plan.name,
      amount: plan.priceCents / 100,
      frequency: plan.billingCycle === 'annual' ? 12 : 1,
      frequencyType: 'months',
    });

    // Aplicar cupom se fornecido
    let discountPercent = 0;
    if (dto.couponCode) {
      const coupon = await this.applyCouponLogic(dto.couponCode, userId);
      discountPercent = coupon.discountPercent;
    }

    // Criar assinatura no MP
    const mpSub = await this.mp.createSubscription({
      customerId,
      planId: mpPlan.id,
      cardTokenId: dto.cardToken,
      paymentMethodId: dto.paymentMethod,
    });

    // Criar subscription no DB
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: dto.planId,
        provider: 'mercadopago',
        providerSubscriptionId: mpSub.id,
        status: 'trialing',
        trialEndsAt,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + (plan.billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    // Se PIX, retornar URL de checkout
    const checkoutUrl = dto.paymentMethod === 'pix' ? mpSub.init_point : mpSub.init_point;

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'subscription.create',
        resourceType: 'subscription',
        resourceId: subscription.id,
        after: { planId: dto.planId, paymentMethod: dto.paymentMethod },
      },
    });

    return { checkoutUrl, subscriptionId: subscription.id };
  }

  // ---------- Status ----------

  async getStatus(userId: string): Promise<{
    subscription: any;
    plan: any;
    nextPayment: any;
  } | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        cancelAt: subscription.cancelAt,
      },
      plan: {
        id: subscription.plan.id,
        code: subscription.plan.code,
        name: subscription.plan.name,
        priceCents: subscription.plan.priceCents,
        billingCycle: subscription.plan.billingCycle,
      },
      nextPayment: subscription.payments[0] ?? null,
    };
  }

  // ---------- Cancel ----------

  async cancel(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['trialing', 'active'] } },
    });
    if (!subscription) throw new Error('NO_ACTIVE_SUBSCRIPTION');

    if (subscription.providerSubscriptionId) {
      try {
        await this.mp.cancelSubscription(subscription.providerSubscriptionId);
      } catch (error) {
        this.logger.warn(`Failed to cancel MP subscription: ${error}`);
      }
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAt: new Date(), status: 'canceled' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'subscription.cancel',
        resourceType: 'subscription',
        resourceId: subscription.id,
      },
    });
  }

  // ---------- Apply Coupon ----------

  async applyCoupon(userId: string, dto: ApplyCouponDto): Promise<{ discountPercent: number; description: string }> {
    return this.applyCouponLogic(dto.code, userId);
  }

  private async applyCouponLogic(code: string, userId: string): Promise<{ discountPercent: number; description: string }> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.active) throw new Error('INVALID_COUPON');

    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('COUPON_EXPIRED');
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) throw new Error('COUPON_LIMIT_REACHED');

    // Verificar se já usou (se não é stackable)
    if (!coupon.stackable) {
      const existingRedemption = await this.prisma.couponRedemption.findFirst({
        where: { couponId: coupon.id, subscription: { userId } },
      });
      if (existingRedemption) throw new Error('COUPON_ALREADY_USED');
    }

    const discountPercent = coupon.type === 'percent' ? coupon.value : 0;
    const description =
      coupon.type === 'percent' ? `${coupon.value}% de desconto` :
      coupon.type === 'fixed' ? `R$ ${(coupon.value / 100).toFixed(2)} de desconto` :
      '1 mês grátis';

    return { discountPercent, description };
  }

  // ---------- Admin: List Plans ----------

  async listPlans(): Promise<any[]> {
    return this.prisma.plan.findMany({ orderBy: { priceCents: 'asc' } });
  }

  async createPlan(dto: CreatePlanDto): Promise<any> {
    return this.prisma.plan.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type as any,
        priceCents: dto.priceCents,
        billingCycle: dto.billingCycle,
        features: (dto.features ?? {}) as any,
        xpMultiplier: dto.xpMultiplier ?? 1,
      },
    });
  }

  // ---------- Admin: List Subscriptions ----------

  async listSubscriptions(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = params.status ? { status: params.status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } }, plan: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ---------- Admin: Create Coupon ----------

  async createCoupon(data: {
    code: string;
    type: string;
    value: number;
    maxUses?: number;
    expiresAt?: Date;
    stackable?: boolean;
  }): Promise<any> {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type as any,
        value: data.value,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
        stackable: data.stackable ?? false,
      },
    });
  }
}
