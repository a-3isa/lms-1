import {
  Controller,
  Post,
  Param,
  Delete,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LessonIdDto } from './dto/lesson-id.dto';
import { CourseIdDto } from './dto/course-id.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  completeLesson(@GetUser() user: User, @Param() params: LessonIdDto) {
    return this.progressService.markLessonComplete(user, params.lessonId);
  }

  @Delete('lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  uncompleteLesson(@GetUser() user: User, @Param() params: LessonIdDto) {
    return this.progressService.markLessonIncomplete(user, params.lessonId);
  }

  @Get('courses/:courseId')
  @UseGuards(JwtAuthGuard)
  courseProgress(@GetUser() user: User, @Param() params: CourseIdDto) {
    return this.progressService.getCourseProgress(user, params.courseId);
  }
}
