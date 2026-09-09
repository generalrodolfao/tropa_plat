import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { CloudflareStreamAdapter } from './cloudflare-stream.adapter';

@Module({
  controllers: [VideoController],
  providers: [VideoService, CloudflareStreamAdapter],
  exports: [VideoService],
})
export class VideoModule {}
