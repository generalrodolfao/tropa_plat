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
import { ProjectsService } from './projects.service';
import { SubmitProjectDto, GradeSubmissionDto } from './dto/projects.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Projetos')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar projetos disponíveis' })
  async listProjects(@CurrentUser() user: { userId: string }) {
    return this.projectsService.listProjects(user.userId);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Detalhes do projeto' })
  async getProjectDetails(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectDetails(projectId);
  }

  @Post('submit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submeter projeto para correção' })
  async submitProject(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitProjectDto,
  ) {
    return this.projectsService.submitProject(user.userId, dto);
  }

  @Post('grade')
  @HttpCode(200)
  @ApiOperation({ summary: 'Avaliar submissão (mentor/admin)' })
  async gradeSubmission(
    @CurrentUser() user: { userId: string },
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.projectsService.gradeSubmission(user.userId, dto);
  }

  @Get('submissions/pending')
  @ApiOperation({ summary: 'Submissões pendentes para avaliação' })
  async getSubmissionsForGrading(@CurrentUser() user: { userId: string }) {
    return this.projectsService.getSubmissionsForGrading(user.userId);
  }

  @Get('my-submissions')
  @ApiOperation({ summary: 'Minhas submissões' })
  async getUserSubmissions(@CurrentUser() user: { userId: string }) {
    return this.projectsService.getUserSubmissions(user.userId);
  }
}
