import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaguesService } from './leagues.service';

@ApiTags('ligas')
@Controller('leagues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaguesController {
  constructor(private readonly leagues: LeaguesService) {}

  @Get('current')
  current(@CurrentUser() user: { userId: string }) {
    return this.leagues.current(user.userId);
  }

  @Get('history')
  history(@CurrentUser() user: { userId: string }) {
    return this.leagues.history(user.userId);
  }
}
