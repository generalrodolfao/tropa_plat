import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobsService } from './jobs.service';

class ApplyDto {
  @IsString()
  jobId!: string;
}

@ApiTags('vagas')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.jobs.list(user.userId);
  }

  @Post('apply')
  apply(@CurrentUser() user: { userId: string }, @Body() body: ApplyDto) {
    return this.jobs.apply(user.userId, body.jobId);
  }
}
