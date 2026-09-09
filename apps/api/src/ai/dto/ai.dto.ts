import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CvParseDto {
  @ApiProperty({ description: 'Texto extraído do CV (PDF/DOCX)' })
  @IsString()
  @MinLength(50)
  text: string;
}

export class CvReviewDto {
  @ApiProperty({ description: 'Texto extraído do CV' })
  @IsString()
  @MinLength(50)
  cvText: string;

  @ApiPropertyOptional({ description: 'Cargo alvo' })
  @IsOptional()
  @IsString()
  targetRole?: string;
}

export class GeneratePdiDto {
  @ApiProperty({ description: 'Objetivo de carreira' })
  @IsString()
  @MaxLength(200)
  objective: string;

  @ApiProperty({ description: 'Skills atuais do usuário (level 0-5)' })
  @IsString()
  currentSkills: string; // JSON string: [{skillId, level}]

  @ApiPropertyOptional({ description: 'Preferência de estilo de aprendizado' })
  @IsOptional()
  @IsString()
  learningStyle?: string;

  @ApiPropertyOptional({ description: 'Horas disponíveis por semana' })
  @IsOptional()
  @IsNumber()
  hoursPerWeek?: number;
}

export class GenerateQuizItemsDto {
  @ApiProperty({ description: 'Skill ID' })
  @IsString()
  skillId: string;

  @ApiProperty({ description: 'Nível de dificuldade alvo (1-5)' })
  @IsNumber()
  targetDifficulty: number;

  @ApiProperty({ description: 'Quantidade de itens' })
  @IsNumber()
  count: number;
}
