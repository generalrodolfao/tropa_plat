import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HackathonsService } from './hackathons.service';

class JoinTeamDto {
  @IsString()
  teamId!: string;
}

@ApiTags('hackathons')
@Controller('hackathons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HackathonsController {
  constructor(private readonly hackathons: HackathonsService) {}

  @Get()
  list() {
    return this.hackathons.listPublic();
  }

  @Get('me')
  myTeams(@CurrentUser() user: { userId: string }) {
    return this.hackathons.myTeams(user.userId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.hackathons.getById(id);
  }

  @Post('join')
  async join(
    @CurrentUser() user: { userId: string },
    @Body() body: JoinTeamDto,
  ) {
    try {
      return await this.hackathons.joinTeam(user.userId, body.teamId);
    } catch (e) {
      if (e instanceof Error && e.message === 'TEAM_FULL') {
        throw new BadRequestException('Equipe já está cheia');
      }
      throw e;
    }
  }
}
