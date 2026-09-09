import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrailsService } from './trails.service';

@ApiTags('trilhas')
@Controller('trilhas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrailsController {
  constructor(private readonly trails: TrailsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar trilhas de estudo do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de trilhas' })
  async list(
    @CurrentUser() user: { userId: string },
    @Query('difficulty') difficulty?: string,
  ) {
    return this.trails.list(user.userId, difficulty);
  }

  @Get(':trailId')
  @ApiOperation({ summary: 'Obter detalhes de uma trilha' })
  @ApiResponse({ status: 200, description: 'Detalhes da trilha' })
  async get(
    @CurrentUser() user: { userId: string },
    @Param('trailId') trailId: string,
  ) {
    return this.trails.get(user.userId, trailId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova trilha de estudo' })
  @ApiResponse({ status: 201, description: 'Trilha criada' })
  async create(
    @CurrentUser() user: { userId: string },
    @Body()
    createDto: {
      name: string;
      description: string;
      courseId: string;
      difficulty?: string;
    },
  ) {
    return this.trails.create(
      user.userId,
      createDto.name,
      createDto.description,
      createDto.courseId,
      createDto.difficulty,
    );
  }

  @Post(':trailId/progress')
  @ApiOperation({ summary: 'Atualizar progresso da trilha' })
  @ApiResponse({ status: 200, description: 'Progresso atualizado' })
  async updateProgress(
    @CurrentUser() user: { userId: string },
    @Param('trailId') trailId: string,
    @Body() body: { completedLessonIds: string[] },
  ) {
    return this.trails.updateProgress(
      user.userId,
      trailId,
      body.completedLessonIds ?? [],
    );
  }

  @Delete(':trailId')
  @ApiOperation({ summary: 'Remover trilha' })
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('trailId') trailId: string,
  ) {
    return this.trails.remove(user.userId, trailId);
  }
}
