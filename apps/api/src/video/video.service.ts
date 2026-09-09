import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareStreamAdapter } from './cloudflare-stream.adapter';
import { RequestUploadDto, CreateTranscriptDto } from './dto/video.dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cf: CloudflareStreamAdapter,
  ) {}

  // ---------- Request Upload ----------

  async requestUpload(dto: RequestUploadDto): Promise<{
    uploadUrl: string;
    videoUid: string;
    assetId: string;
  }> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new Error('LESSON_NOT_FOUND');

    const existing = await this.prisma.videoAsset.findUnique({ where: { lessonId: dto.lessonId } });
    if (existing && existing.status === 'ready') {
      throw new Error('VIDEO_ALREADY_EXISTS');
    }

    const ticket = await this.cf.createUploadTicket({
      name: dto.name ?? lesson.title,
      meta: { lessonId: dto.lessonId, courseTitle: lesson.title },
      requireSignedURLs: true,
      maxDurationSeconds: 600,
    });

    const asset = existing
      ? await this.prisma.videoAsset.update({
          where: { id: existing.id },
          data: {
            providerUid: ticket.uid,
            status: 'processing',
          },
        })
      : await this.prisma.videoAsset.create({
          data: {
            lessonId: dto.lessonId,
            provider: 'cloudflare_stream',
            providerUid: ticket.uid,
            status: 'processing',
          },
        });

    return {
      uploadUrl: ticket.uploadURL,
      videoUid: ticket.uid,
      assetId: asset.id,
    };
  }

  // ---------- Get Video by Lesson ----------

  async getByLessonId(lessonId: string, userId?: string): Promise<any> {
    // Try VideoAsset first
    const asset = await this.prisma.videoAsset.findUnique({
      where: { lessonId },
      include: { transcript: true },
    });

    if (asset && asset.status === 'ready') {
      let signedHlsUrl: string | null = null;
      let signedMp4Url: string | null = null;

      if (asset.providerUid && userId) {
        try {
          const signed = await this.cf.getSignedURL(asset.providerUid);
          signedHlsUrl = signed.url;

          // Generate MP4 signed URL (Cloudflare Stream supports both)
          if (asset.mp4Url) {
            // Extract the video UID from the HLS URL to build MP4 URL
            // CF Stream: https://customer-{code}.cloudflarestream.com/{uid}/...
            const mp4BaseUrl = asset.mp4Url.replace('/downloads/default.mp4', '');
            signedMp4Url = `${mp4BaseUrl}/downloads/default.mp4?token=${signed.token}`;
          }
        } catch (error) {
          this.logger.warn(`Failed to generate signed URLs: ${error}`);
        }
      }

      return {
        id: asset.id,
        status: asset.status,
        providerUid: asset.providerUid,
        hlsUrl: signedHlsUrl ?? asset.hlsUrl,
        mp4Url: signedMp4Url ?? asset.mp4Url,
        duration: asset.duration,
        watermark: asset.watermark,
        captions: asset.captions,
        transcript: asset.transcript,
      };
    }

    // Fallback: check lesson.content.videoUrl
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (lesson?.content) {
      const content = lesson.content as any;
      if (content.videoUrl) {
        return {
          id: null,
          status: 'ready',
          providerUid: null,
          hlsUrl: content.videoUrl,
          mp4Url: null,
          duration: lesson.durationSec || null,
          watermark: false,
          captions: null,
          transcript: null,
        };
      }
    }

    throw new Error('VIDEO_NOT_FOUND');
  }

  // ---------- Webhook: Video Ready ----------

  async handleVideoReady(videoUid: string, payload: any): Promise<void> {
    const asset = await this.prisma.videoAsset.findFirst({
      where: { providerUid: videoUid },
    });

    if (!asset) {
      this.logger.warn(`VideoAsset not found for uid ${videoUid}`);
      return;
    }

    await this.prisma.videoAsset.update({
      where: { id: asset.id },
      data: {
        status: 'ready',
        hlsUrl: payload.play?.hls ?? null,
        mp4Url: payload.play?.mp4 ?? null,
        duration: payload.duration ?? null,
        storageMinutes: payload.size ? payload.size / (1024 * 1024) : null,
        renditions: payload.input ?? null,
      },
    });

    this.logger.log(`Video ${videoUid} ready for lesson ${asset.lessonId}`);
  }

  // ---------- Webhook: Video Error ----------

  async handleVideoError(videoUid: string, error: string): Promise<void> {
    const asset = await this.prisma.videoAsset.findFirst({
      where: { providerUid: videoUid },
    });

    if (!asset) return;

    await this.prisma.videoAsset.update({
      where: { id: asset.id },
      data: { status: 'error' },
    });

    this.logger.error(`Video ${videoUid} error: ${error}`);
  }

  // ---------- Transcript ----------

  async upsertTranscript(videoAssetId: string, dto: CreateTranscriptDto): Promise<any> {
    const asset = await this.prisma.videoAsset.findUnique({ where: { id: videoAssetId } });
    if (!asset) throw new Error('VIDEO_ASSET_NOT_FOUND');

    return this.prisma.transcript.upsert({
      where: { videoAssetId },
      create: {
        videoAssetId,
        lang: dto.lang,
        text: dto.text,
        sentences: dto.sentences as any,
      },
      update: {
        lang: dto.lang,
        text: dto.text,
        sentences: dto.sentences as any,
      },
    });
  }

  async getTranscript(videoAssetId: string): Promise<any> {
    return this.prisma.transcript.findUnique({ where: { videoAssetId } });
  }

  // ---------- Parse Video Content (extract chapters from transcript) ----------

  async parseVideoChapters(videoAssetId: string): Promise<any> {
    const transcript = await this.prisma.transcript.findUnique({
      where: { videoAssetId },
    });

    if (!transcript?.sentences) {
      return { chapters: [] };
    }

    const sentences = transcript.sentences as any[];
    if (sentences.length === 0) {
      return { chapters: [] };
    }

    // Group sentences into chapters based on topic changes
    // Simple heuristic: new chapter every ~2 minutes or when there's a long pause
    const chapters: any[] = [];
    let currentChapter = {
      title: 'Introdução',
      startTime: sentences[0].start,
      endTime: sentences[0].end,
      sentences: [sentences[0]],
    };

    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i];
      const prevSentence = sentences[i - 1];
      const timeGap = sentence.start - prevSentence.end;

      // Start new chapter if:
      // - More than 2 minutes since last sentence
      // - Or 5+ seconds gap between sentences
      // - Or we've accumulated 3+ minutes of content
      const chapterDuration = sentence.start - currentChapter.startTime;
      if (timeGap > 5 || chapterDuration > 120) {
        chapters.push({
          ...currentChapter,
          endTime: prevSentence.end,
          duration: prevSentence.end - currentChapter.startTime,
          summary: currentChapter.sentences.map((s: any) => s.text).join(' ').slice(0, 200),
        });

        currentChapter = {
          title: `Capítulo ${chapters.length + 1}`,
          startTime: sentence.start,
          endTime: sentence.end,
          sentences: [sentence],
        };
      } else {
        currentChapter.sentences.push(sentence);
        currentChapter.endTime = sentence.end;
      }
    }

    // Add final chapter
    const lastSentence = currentChapter.sentences[currentChapter.sentences.length - 1];
    chapters.push({
      ...currentChapter,
      endTime: lastSentence.end,
      duration: lastSentence.end - currentChapter.startTime,
      summary: currentChapter.sentences.map((s: any) => s.text).join(' ').slice(0, 200),
    });

    return { chapters };
  }

  // ---------- Admin ----------

  async listAll(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.videoAsset.findMany({
        include: { lesson: { select: { id: true, title: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.videoAsset.count(),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
