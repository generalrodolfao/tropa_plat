import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  Logger,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { WebhookHandler } from './webhook.handler';
import { CreateCheckoutDto, ApplyCouponDto, WebhookMercadoPagoDto, CreatePlanDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookHandler: WebhookHandler,
  ) {}

  // ---------- Checkout (autenticado) ----------

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar checkout de assinatura' })
  async checkout(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentsService.checkout(user.userId, dto);
  }

  // ---------- Status (autenticado) ----------

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Status da assinatura do usuário' })
  async status(@CurrentUser() user: { userId: string }) {
    return this.paymentsService.getStatus(user.userId);
  }

  // ---------- Cancel (autenticado) ----------

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar assinatura' })
  async cancel(@CurrentUser() user: { userId: string }) {
    await this.paymentsService.cancel(user.userId);
    return { ok: true };
  }

  // ---------- Apply Coupon (autenticado) ----------

  @Post('apply-coupon')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Aplicar cupom de desconto' })
  async applyCoupon(
    @CurrentUser() user: { userId: string },
    @Body() dto: ApplyCouponDto,
  ) {
    return this.paymentsService.applyCoupon(user.userId, dto);
  }

  // ---------- Webhook (público, assinatura verificada pelo MP) ----------

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook do Mercado Pago' })
  async webhook(@Body() body: WebhookMercadoPagoDto, @Req() req: any) {
    this.logger.log(`Webhook received: ${body.type} action=${body.action}`);

    // Mercado Pago envia type=payment ou type=preapproval
    if (body.type === 'payment') {
      await this.webhookHandler.handlePaymentNotification(
        body.id,
        body.action,
        body.data.id,
      );
    } else if (body.type === 'preapproval') {
      await this.webhookHandler.handleSubscriptionNotification(
        body.id,
        body.action,
        body.data.id,
      );
    }

    return { ok: true };
  }

  // ---------- Admin: Plans ----------

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar planos (admin)' })
  async listPlans() {
    return this.paymentsService.listPlans();
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar plano (admin)' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.paymentsService.createPlan(dto);
  }

  // ---------- Admin: Subscriptions ----------

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar assinaturas (admin)' })
  async listSubscriptions(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.listSubscriptions({
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ---------- Admin: Coupons ----------

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar cupom (admin)' })
  async createCoupon(
    @Body() body: { code: string; type: string; value: number; maxUses?: number; expiresAt?: string; stackable?: boolean },
  ) {
    return this.paymentsService.createCoupon({
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }
}
