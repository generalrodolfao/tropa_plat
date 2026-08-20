import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';

class LessonIdDto {
  @IsString()
  lessonId!: string;
}

@ApiTags('progresso')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('start')
  start(@CurrentUser() user: { userId: string }, @Body() body: LessonIdDto) {
    return this.progress.startLesson(user.userId, body.lessonId);
  }

  @Post('complete')
  complete(@CurrentUser() user: { userId: string }, @Body() body: LessonIdDto) {
    return this.progress.completeLesson(user.userId, body.lessonId);
  }

  @Get('course/:courseId')
  courseProgress(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    return this.progress.getCourseProgress(user.userId, courseId);
  }
}
