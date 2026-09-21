import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GameService } from './game.service';

@ApiTags('Jogo')
@Controller('game')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GameController {
  constructor(private readonly game: GameService) {}

  @Get('sso')
  @ApiOperation({ summary: 'Gerar link SSO de entrada no jogo Vale dos Dados' })
  sso(@CurrentUser() user: { userId: string }) {
    return this.game.createSsoLink(user.userId);
  }
}
