import {
  Body,
  Controller,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  CreateModuleDto,
  CreateLessonDto,
  CreateEbookDto,
} from './dto/content.dto';

@ApiTags('admin-conteudo')
@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class AdminContentController {
  constructor(private readonly courses: CoursesService) {}

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.courses.createCourse(dto);
  }

  @Post('courses/:courseId/modules')
  createModule(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.courses.createModule(courseId, dto);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.courses.createLesson(moduleId, dto);
  }

  @Patch('lessons/:lessonId')
  updateLesson(@Param('lessonId') lessonId: string, @Body() dto: any) {
    return this.courses.updateLesson(lessonId, dto);
  }

  @Post('ebooks')
  createEbook(@Body() dto: CreateEbookDto) {
    return this.courses.createEbook(dto);
  }

  @Post('courses/:courseId/publish')
  publish(@Param('courseId') courseId: string) {
    return this.courses.publishCourse(courseId);
  }
}
