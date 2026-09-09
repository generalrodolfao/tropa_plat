import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  timeLimitSec?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  xpAward?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'O que é uma tabela no SQL?' })
  @IsString()
  prompt: string;

  @ApiProperty({
    example: [
      'Uma linha',
      'Uma coluna',
      'Uma estrutura de dados',
      'Um banco de dados',
    ],
  })
  @IsArray()
  options: string[];

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  correctIndex: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  skillId?: string;
}

export class SubmitAttemptDto {
  @ApiProperty({
    example: [
      { questionId: 'uuid', chosenIndex: 0, timeMs: 5000 },
      { questionId: 'uuid', chosenIndex: 2, timeMs: 3000 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class AnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  chosenIndex: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  timeMs: number;
}
