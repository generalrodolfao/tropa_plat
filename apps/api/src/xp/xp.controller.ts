import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { XpService } from './xp.service';

@ApiTags('gamificacao')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class XpController {
  constructor(private readonly xp: XpService) {}

  @Get('summary')
  async summary(@CurrentUser() user: { userId: string }) {
    return this.xp.getSummary(user.userId);
  }

  @Get('ranks')
  ranks() {
    return XpService.ranks();
  }
}
