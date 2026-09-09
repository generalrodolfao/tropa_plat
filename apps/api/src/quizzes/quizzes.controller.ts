import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, CreateQuestionDto, SubmitAttemptDto } from './dto/quizzes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // ---------- Get Quiz by Lesson (autenticado) ----------

  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter quiz de uma aula' })
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.getByLessonId(lessonId);
  }

  // ---------- Submit Attempt (autenticado) ----------

  @Post(':quizId/attempt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Submeter tentativa do quiz' })
  async submitAttempt(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(user.userId, quizId, dto);
  }

  // ---------- Get Attempt (autenticado) ----------

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes de uma tentativa' })
  async getAttempt(
    @CurrentUser() user: { userId: string },
    @Param('attemptId') attemptId: string,
  ) {
    return this.quizzesService.getAttempt(attemptId, user.userId);
  }

  // ---------- Admin ----------

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os quizzes (admin)' })
  async listQuizzes(
    @CurrentUser() user: { userId: string },
  ) {
    return this.quizzesService.listQuizzes({});
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar quiz para uma aula (admin)' })
  async createQuiz(@Body() dto: CreateQuizDto) {
    return this.quizzesService.createQuiz(dto);
  }

  @Post('admin/:quizId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Adicionar pergunta ao quiz (admin)' })
  async createQuestion(
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzesService.createQuestion(quizId, dto);
  }

  @Delete('admin/questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remover pergunta (admin)' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.quizzesService.deleteQuestion(questionId);
    return { ok: true };
  }
}
