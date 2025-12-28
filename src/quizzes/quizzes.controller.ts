import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CourseOwnerGuard } from '../lessons/course-owner.guard';

@Controller('courses/:courseId/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @UseGuards(CourseOwnerGuard)
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateQuizDto,
    @GetUser() user: User,
  ) {
    return this.quizzesService.create(courseId, dto, user);
  }

  @Get()
  findAll(@Param('courseId') courseId: string, @GetUser() user?: User) {
    return this.quizzesService.findAll(courseId, user);
  }

  @Get(':id')
  findOne(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @GetUser() user?: User,
  ) {
    return this.quizzesService.findOne(courseId, id, user);
  }

  @Patch(':id')
  @UseGuards(CourseOwnerGuard)
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @GetUser() user: User,
  ) {
    return this.quizzesService.update(courseId, id, dto, user);
  }

  @Delete(':id')
  @UseGuards(CourseOwnerGuard)
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.quizzesService.remove(courseId, id, user);
  }

  @Post(':id/submit')
  submit(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() body: { answers: Record<string, string> },
  ) {
    return this.quizzesService.submit(courseId, id, user, body.answers);
  }
}
