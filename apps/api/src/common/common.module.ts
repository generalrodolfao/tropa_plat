import { Global, Module } from '@nestjs/common';
import { FileTextService } from './file-text.service';

@Global()
@Module({
  providers: [FileTextService],
  exports: [FileTextService],
})
export class CommonModule {}
