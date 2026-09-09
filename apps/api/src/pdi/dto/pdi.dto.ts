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

export class AnswerItemDto {
  @ApiProperty({ description: 'ID da questão' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Índice da resposta (0-3)' })
  @IsNumber()
  @Min(0)
  @Max(3)
  selectedIndex: number;

  @ApiPropertyOptional({ description: 'Tempo gasto em segundos' })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

export class SubmitQuizDto {
  @ApiProperty({ description: 'ID da skill sendo avaliada' })
  @IsString()
  skillId: string;

  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}

export class UpdateSkillScoreDto {
  @ApiProperty({ description: 'ID da skill' })
  @IsString()
  skillId: string;

  @ApiProperty({ description: 'Novo nível (0-5)' })
  @IsNumber()
  @Min(0)
  @Max(5)
  level: number;

  @ApiPropertyOptional({ description: 'Fonte da avaliação' })
  @IsOptional()
  @IsString()
  source?: string;
}
