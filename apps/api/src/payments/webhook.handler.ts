import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoAdapter, MPPayment } from './mercadopago.adapter';

@Injectable()
export class WebhookHandler {
  private readonly logger = new Logger(WebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoAdapter,
  ) {}

  async handlePaymentNotification(eventId: string, action: string, paymentId: string): Promise<void> {
    // Idempotência
    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      this.logger.debug(`Webhook ${eventId} already processed, skipping`);
      return;
    }

    await this.prisma.webhookEvent.create({
      data: {
        provider: 'mercadopago',
        eventId,
        payload: { action, paymentId },
        status: 'processing',
      },
    });

    try {
      const payment = await this.mp.getPayment(paymentId);
      await this.processPayment(payment);

      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to process webhook ${eventId}: ${error}`);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'failed' },
      });
    }
  }

  async handleSubscriptionNotification(eventId: string, action: string, subscriptionId: string): Promise<void> {
    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      this.logger.debug(`Webhook ${eventId} already processed, skipping`);
      return;
    }

    await this.prisma.webhookEvent.create({
      data: {
        provider: 'mercadopago',
        eventId,
        payload: { action, subscriptionId },
        status: 'processing',
      },
    });

    try {
      const mpSub = await this.mp.getSubscription(subscriptionId);
      await this.processSubscription(mpSub);

      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to process webhook ${eventId}: ${error}`);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'failed' },
      });
    }
  }

  private async processPayment(payment: MPPayment): Promise<void> {
    const paymentRecord = await this.prisma.payment.findFirst({
      where: { providerPaymentId: String(payment.id) },
    });

    if (!paymentRecord) {
      // Pagamento sem assinatura associada (pode ser one-time)
      this.logger.warn(`Payment ${payment.id} has no associated subscription`);
      return;
    }

    const statusMap: Record<string, string> = {
      approved: 'paid',
      pending: 'pending',
      authorized: 'pending',
      in_process: 'pending',
      rejected: 'failed',
      cancelled: 'failed',
      refunded: 'refunded',
      charged_back: 'chargeback',
    };

    const newStatus = statusMap[payment.status] ?? 'pending';

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: newStatus as any,
          paidAt: payment.status === 'approved' ? new Date(payment.date_approved!) : null,
          receiptUrl: (payment as any).statement_descriptor ? String((payment as any).statement_descriptor) : undefined,
        },
      });

      if (payment.status === 'approved') {
        await this.reactivateSubscriptionIfPastDue(tx, paymentRecord.subscriptionId);
      }

      // Ledger
      await tx.transaction.create({
        data: {
          subscriptionId: paymentRecord.subscriptionId,
          type: 'revenue',
          amountCents: payment.transaction_amount,
          netCents: payment.transaction_amount,
          providerMeta: payment as any,
          status: payment.status,
        },
      });
    });
  }

  private async processSubscription(mpSub: any): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: mpSub.id },
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${mpSub.id} not found in DB`);
      return;
    }

    const statusMap: Record<string, string> = {
      authorized: 'active',
      paused: 'paused',
      cancelled: 'canceled',
      waiting: 'trialing',
    };

    const newStatus = statusMap[mpSub.status] ?? subscription.status;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: newStatus as any },
    });
  }

  private async reactivateSubscriptionIfPastDue(
    tx: any,
    subscriptionId: string,
  ): Promise<void> {
    const sub = await tx.subscription.findUnique({ where: { id: subscriptionId } });
    if (sub && sub.status === 'past_due') {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'active' },
      });
    }
  }
}
