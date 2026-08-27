import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'etl-dw-black-ops-airflow' })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiProperty({ example: 'ETL DW Black Ops com Airflow' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: 'Pipeline moderno de ETL com Airflow' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'intermediario' })
  @IsOptional()
  @IsString()
  level?: string;
}

export class CreateModuleDto {
  @ApiProperty({ example: 'Fundamentos de Airflow' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'AIRFLOW-01' })
  @IsOptional()
  @IsString()
  codename?: string;

  @ApiPropertyOptional({ example: 'watch' })
  @IsOptional()
  @IsEnum(['watch', 'do', 'play'] as any)
  type?: string;
}

export class CreateLessonDto {
  @ApiProperty({ example: 'Instalando Airflow com Docker' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'video' })
  @IsEnum(['video', 'article', 'sandbox', 'quiz', 'project', 'challenge'] as any)
  type: string;

  @ApiPropertyOptional({ example: 900 })
  @IsOptional()
  durationSec?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  xpAward?: number;

  @ApiPropertyOptional({ example: 'https://stream.cloudflare.com/...' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  content?: any;
}

export class CreateEbookDto {
  @ApiProperty({ example: 'etl-airflow-guia' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Guia ETL com Airflow' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'ETL & Airflow' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  pages?: number;
}
