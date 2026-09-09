import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PDIService } from './pdi.service';
import { SubmitQuizDto, UpdateSkillScoreDto } from './dto/pdi.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('PDI')
@Controller('pdi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PDIController {
  constructor(private readonly pdiService: PDIService) {}

  @Get('skills')
  @ApiOperation({ summary: 'Obter scores de skills do usuário' })
  async getSkillScores(@CurrentUser() user: { userId: string }) {
    return this.pdiService.getSkillScores(user.userId)
  }

  @Post('quiz/submit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submeter tentativa de quiz com scoring IRT' })
  async submitQuiz(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitQuizDto,
  ) {
    return this.pdiService.submitQuizAttempt(user.userId, dto)
  }

  @Get('journey')
  @ApiOperation({ summary: 'Obter grafo de jornada do usuário' })
  async getJourneyGraph(@CurrentUser() user: { userId: string }) {
    return this.pdiService.getJourneyGraph(user.userId)
  }

  @Post('skills/:skillId/update')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar score de skill manualmente' })
  async updateSkillScore(
    @CurrentUser() user: { userId: string },
    @Param('skillId') skillId: string,
    @Body() dto: UpdateSkillScoreDto,
  ) {
    return this.pdiService.updateSkillScore(user.userId, { ...dto, skillId })
  }
}
