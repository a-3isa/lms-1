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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { CourseOwnerGuard } from './course-owner.guard';

@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(CourseOwnerGuard)
  create(
    @Param('courseId') courseId: string,
    @GetUser() user: User,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.lessonsService.create(courseId, createLessonDto, user);
  }

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.lessonsService.findAll(courseId);
  }

  @Get(':id')
  findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return this.lessonsService.findOne(courseId, id);
  }

  @Patch(':id')
  @UseGuards(CourseOwnerGuard)
  update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(courseId, id, updateLessonDto, user);
  }

  @Delete(':id')
  @UseGuards(CourseOwnerGuard)
  remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.lessonsService.remove(courseId, id, user);
  }
}
