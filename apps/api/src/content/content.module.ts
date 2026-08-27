import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminSeedController } from './admin-seed.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController, AdminContentController, AdminSeedController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class ContentModule {}
