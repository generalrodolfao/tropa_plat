import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'ID do plano', example: 'uuid-do-plano' })
  @IsUUID()
  planId: string;

  @ApiProperty({ enum: ['pix', 'card'], example: 'pix' })
  @IsString()
  @IsIn(['pix', 'card'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Código de cupom de desconto' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  couponCode?: string;

  @ApiPropertyOptional({ example: 'token-mp-xxx' })
  @IsOptional()
  @IsString()
  cardToken?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Min(12)
  installments?: number;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'PROMO10' })
  @IsString()
  @MaxLength(30)
  code: string;
}

export class WebhookMercadoPagoDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsBoolean()
  live_mode: boolean;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  date_created: string;

  @ApiProperty()
  @IsString()
  user_id: string;

  @ApiProperty()
  @IsString()
  api_version: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @Allow()
  data: Record<string, string>;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'soldado' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Soldado' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: ['b2c_monthly', 'b2c_annual', 'b2b_seats', 'institution'],
  })
  @IsEnum(['b2c_monthly', 'b2c_annual', 'b2b_seats', 'institution'] as const)
  type: string;

  @ApiProperty({ example: 9900 })
  @IsNumber()
  @Min(0)
  priceCents: number;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsIn(['monthly', 'annual'])
  billingCycle: string;

  @ApiPropertyOptional({ example: { sandbox_hours: 10, seats: 1 } })
  @IsOptional()
  features?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  xpMultiplier?: number;
}
