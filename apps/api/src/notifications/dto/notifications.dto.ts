import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'badge_earned' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Nova conquista desbloqueada!' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Você ganhou a badge "Primeira Missão"' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, unknown>;
}

export class UpdatePreferencesDto {
  @ApiProperty({ example: 'badge_earned' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'in_app' })
  @IsString()
  @IsEnum(['in_app', 'push', 'email'])
  channel: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}

export class MarkReadDto {
  @ApiProperty({ example: 'notification-uuid' })
  @IsString()
  notificationId: string;
}
