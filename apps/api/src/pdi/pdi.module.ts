import { Module } from '@nestjs/common';
import { PDIController } from './pdi.controller';
import { PDIService } from './pdi.service';

@Module({
  controllers: [PDIController],
  providers: [PDIService],
  exports: [PDIService],
})
export class PDIModule {}
