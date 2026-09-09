import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { RequestUploadDto, VideoWebhookDto, CreateTranscriptDto } from './dto/video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  // ---------- Request Upload (autenticado) ----------

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar upload de vídeo via TUS' })
  async requestUpload(
    @CurrentUser() user: { userId: string },
    @Body() dto: RequestUploadDto,
  ) {
    return this.videoService.requestUpload(dto);
  }

  // ---------- Get Video by Lesson (autenticado) ----------

  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter vídeo de uma aula' })
  async getByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.videoService.getByLessonId(lessonId, user.userId);
  }

  // ---------- Webhook (público, Cloudflare chama) ----------

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook do Cloudflare Stream' })
  async webhook(@Body() body: VideoWebhookDto) {
    this.logger.log(`CF Stream webhook: uid=${body.uid} status=${body.status}`);

    if (body.status === 'ready') {
      await this.videoService.handleVideoReady(body.uid, body);
    } else if (body.status === 'error') {
      await this.videoService.handleVideoError(body.uid, body.error ?? 'unknown');
    }

    return { ok: true };
  }

  // ---------- Transcript (autenticado) ----------

  @Post(':videoAssetId/transcript')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Criar/atualizar transcrição do vídeo' })
  async upsertTranscript(
    @Param('videoAssetId') videoAssetId: string,
    @Body() dto: CreateTranscriptDto,
  ) {
    return this.videoService.upsertTranscript(videoAssetId, dto);
  }

  @Get(':videoAssetId/transcript')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter transcrição do vídeo' })
  async getTranscript(@Param('videoAssetId') videoAssetId: string) {
    return this.videoService.getTranscript(videoAssetId);
  }

  // ---------- Parse Chapters from Transcript ----------

  @Get(':videoAssetId/chapters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extrair capítulos da transcrição do vídeo' })
  async getChapters(@Param('videoAssetId') videoAssetId: string) {
    return this.videoService.parseVideoChapters(videoAssetId);
  }

  // ---------- Admin ----------

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os vídeos (admin)' })
  async listAll(
    @CurrentUser() user: { userId: string },
    @Param('page') page?: string,
    @Param('limit') limit?: string,
  ) {
    return this.videoService.listAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
