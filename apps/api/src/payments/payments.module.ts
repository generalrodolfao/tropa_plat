import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoAdapter } from './mercadopago.adapter';
import { WebhookHandler } from './webhook.handler';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoAdapter, WebhookHandler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
