import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CampsService } from './camps.service';
import { StartCampSessionDto, SubmitCampAnswerDto } from './dto/camps.dto';

@ApiTags('Camps')
@Controller('camps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampsController {
  constructor(private readonly camps: CampsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar camps de treino e progresso do usuário' })
  list(@CurrentUser() user: { userId: string }) {
    return this.camps.listCamps(user.userId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Histórico de sessões de camp do usuário' })
  history(@CurrentUser() user: { userId: string }) {
    return this.camps.history(user.userId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Detalhes de uma sessão de camp' })
  getSession(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.camps.getSession(user.userId, sessionId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhes de um camp' })
  getCamp(
    @CurrentUser() user: { userId: string },
    @Param('slug') slug: string,
  ) {
    return this.camps.getCamp(user.userId, slug);
  }

  @Post(':slug/sessions')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar uma sessão de treino no camp' })
  startSession(
    @CurrentUser() user: { userId: string },
    @Param('slug') slug: string,
    @Body() dto: StartCampSessionDto,
  ) {
    return this.camps.startSession(user.userId, slug, dto);
  }

  @Post('sessions/:sessionId/answers')
  @HttpCode(200)
  @ApiOperation({ summary: 'Responder um item da sessão' })
  submitAnswer(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitCampAnswerDto,
  ) {
    return this.camps.submitAnswer(user.userId, sessionId, dto);
  }

  @Post('sessions/:sessionId/finish')
  @HttpCode(200)
  @ApiOperation({ summary: 'Finalizar a sessão e calcular XP' })
  finishSession(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.camps.finishSession(user.userId, sessionId);
  }
}
