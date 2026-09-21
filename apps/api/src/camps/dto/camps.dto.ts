import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CAMP_FORMATS = [
  'quiz',
  'exercise',
  'interview',
  'requirements',
  'hotseat',
] as const;

export type CampFormat = (typeof CAMP_FORMATS)[number];

export class StartCampSessionDto {
  @ApiPropertyOptional({
    enum: [...CAMP_FORMATS, 'mixed'],
    example: 'mixed',
    description:
      'Formato da sessão ("mixed" mistura todos os formatos do camp)',
  })
  @IsOptional()
  @IsIn([...CAMP_FORMATS, 'mixed'])
  format?: string;

  @ApiPropertyOptional({ example: 5, minimum: 3, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(12)
  count?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ enum: ['standard', 'hotseat'] })
  @IsOptional()
  @IsIn(['standard', 'hotseat'])
  mode?: 'standard' | 'hotseat';
}

export class SubmitCampAnswerDto {
  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  itemIndex: number;

  @ApiPropertyOptional({ example: 2, description: 'Índice escolhido (quiz)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  chosenIndex?: number;

  @ApiPropertyOptional({ description: 'Resposta textual (formatos abertos)' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeMs?: number;
}
