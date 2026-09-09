import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitProjectDto {
  @ApiProperty({ description: 'ID do projeto' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'URL do repositório ou link de entrega' })
  @IsString()
  submissionUrl: string;

  @ApiPropertyOptional({ description: 'Descrição da submissão' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Screenshots ou links adicionais' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class GradeSubmissionDto {
  @ApiProperty({ description: 'ID da submissão' })
  @IsString()
  submissionId: string;

  @ApiProperty({ description: 'Nota geral (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ description: 'Feedback detalhado' })
  @IsString()
  feedback: string;

  @ApiPropertyOptional({ description: 'Notas por critério da rubrica' })
  @IsOptional()
  criteriaScores?: Record<string, number>;
}

export class RubricDto {
  @ApiProperty({ description: 'Nome do critério' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Peso do critério' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'Descrição do critério' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Níveis de avaliação' })
  @IsArray()
  levels: Array<{ label: string; description: string; score: number }>;
}
