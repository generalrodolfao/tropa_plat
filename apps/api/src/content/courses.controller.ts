import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';

@ApiTags('conteudo')
@Controller('content')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get('courses')
  listCourses() {
    return this.courses.listPublished();
  }

  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string) {
    return this.courses.getBySlug(slug);
  }

  @Get('lessons/:id')
  getLesson(@Param('id') id: string) {
    return this.courses.getLesson(id);
  }
}
