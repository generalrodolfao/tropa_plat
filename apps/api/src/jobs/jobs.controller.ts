import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobsService } from './jobs.service';

class ApplyDto {
  @IsString()
  jobId!: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}

@ApiTags('vagas')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vagas com fit-score' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skills', required: false })
  list(
    @CurrentUser() user: { userId: string },
    @Query('search') search?: string,
    @Query('skills') skills?: string,
  ) {
    return this.jobs.list(user.userId, {
      search,
      skills: skills?.split(','),
    });
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Detalhes da vaga' })
  getJobDetails(@Param('jobId') jobId: string) {
    return this.jobs.getJobDetails(jobId);
  }

  @Post('apply')
  @HttpCode(200)
  @ApiOperation({ summary: 'Candidatar-se a uma vaga (easy-apply)' })
  apply(@CurrentUser() user: { userId: string }, @Body() body: ApplyDto) {
    return this.jobs.apply(user.userId, body.jobId);
  }

  @Get('my-applications')
  @ApiOperation({ summary: 'Minhas candidaturas' })
  getMyApplications(@CurrentUser() user: { userId: string }) {
    return this.jobs.getMyApplications(user.userId);
  }
}
