import { Module } from '@nestjs/common';
import { CampsController } from './camps.controller';
import { CampsService } from './camps.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [CampsController],
  providers: [CampsService],
})
export class CampsModule {}
