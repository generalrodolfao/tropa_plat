import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HackathonsService } from './hackathons.service';

class CreateTeamDto {
  @IsString()
  name!: string;
}

class SubmitDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  repoUrl?: string;

  @IsOptional()
  @IsString()
  demoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class ScoreDto {
  @IsObject()
  criteriaScores!: Record<string, number>;

  @IsNumber()
  totalScore!: number;

  @IsOptional()
  @IsString()
  feedbackMd?: string;
}

class CreateHackathonDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  rulesMd?: string;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsString()
  submissionDeadline?: string;

  @IsOptional()
  @IsNumber()
  prizePoolCents?: number;

  @IsOptional()
  @IsNumber()
  maxTeamSize?: number;

  @IsOptional()
  @IsNumber()
  xpMultiplier?: number;

  @IsOptional()
  @IsObject()
  judgingCriteria?: any;

  @IsOptional()
  @IsString()
  sponsorOrgId?: string;
}

@ApiTags('hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathons: HackathonsService) {}

  // ---------- Public ----------

  @Get()
  list() {
    return this.hackathons.listPublic();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.hackathons.getById(id);
  }

  // ---------- Authenticated ----------

  @Get('me/teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myTeams(@CurrentUser() user: { userId: string }) {
    return this.hackathons.myTeams(user.userId);
  }

  @Post('teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar equipe no hackathon' })
  async createTeam(
    @CurrentUser() user: { userId: string },
    @Body() body: { hackathonId: string; name: string },
  ) {
    try {
      return await this.hackathons.createTeam(user.userId, body.hackathonId, body.name);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'ALREADY_IN_TEAM') throw new BadRequestException('Você já está em uma equipe neste hackathon');
        if (e.message === 'HACKATHON_NOT_OPEN') throw new BadRequestException('Hackathon não está aceitando inscrições');
      }
      throw e;
    }
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async join(
    @CurrentUser() user: { userId: string },
    @Body() body: CreateTeamDto & { teamId: string },
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

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submeter projeto no hackathon' })
  async submit(
    @CurrentUser() user: { userId: string },
    @Body() body: SubmitDto & { hackathonId: string },
  ) {
    try {
      return await this.hackathons.submit(user.userId, body.hackathonId, body);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'ALREADY_SUBMITTED') throw new BadRequestException('Você já submeteu um projeto');
        if (e.message === 'HACKATHON_NOT_ACCEPTING_SUBMISSIONS') throw new BadRequestException('Hackathon não está aceitando submissões');
      }
      throw e;
    }
  }

  @Get(':hackathonId/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSubmissions(@Param('hackathonId') hackathonId: string) {
    return this.hackathons.getSubmissions(hackathonId);
  }

  @Post('submissions/:submissionId/score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('judge', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pontuar submissão (judge)' })
  async scoreSubmission(
    @CurrentUser() user: { userId: string },
    @Param('submissionId') submissionId: string,
    @Body() dto: ScoreDto,
  ) {
    return this.hackathons.scoreSubmission(user.userId, submissionId, dto);
  }

  @Get('submissions/:submissionId/scores')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getScores(@Param('submissionId') submissionId: string) {
    return this.hackathons.getScores(submissionId);
  }

  // ---------- Admin ----------

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os hackathons (admin)' })
  async listAll() {
    return this.hackathons.listAll();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar hackathon (admin)' })
  async createHackathon(@Body() dto: CreateHackathonDto) {
    return this.hackathons.createHackathon(dto);
  }

  @Put('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do hackathon (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.hackathons.updateStatus(id, body.status);
  }
}
