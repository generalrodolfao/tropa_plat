import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class RequestUploadDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiPropertyOptional({ example: 'Aula 1 - Introdução ao SQL' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class VideoWebhookDto {
  @ApiProperty()
  @IsString()
  uid: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  error?: string;

  @ApiProperty()
  @IsOptional()
  input?: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  meta?: Record<string, unknown>;
}

export class CreateTranscriptDto {
  @ApiProperty({ example: 'pt-BR' })
  @IsString()
  lang: string;

  @ApiProperty({ example: 'Texto completo da transcrição...' })
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  sentences?: Array<{ text: string; start: number; end: number }>;
}
