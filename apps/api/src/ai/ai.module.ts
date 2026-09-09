import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { LLMAdapter } from './llm.adapter';

@Module({
  controllers: [AIController],
  providers: [AIService, LLMAdapter],
  exports: [AIService],
})
export class AIModule {}
