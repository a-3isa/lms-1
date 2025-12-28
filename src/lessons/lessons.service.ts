import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { User, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  public async create(courseId: string, dto: CreateLessonDto, user: User) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (!(user.role === UserRole.ADMIN || course.teacher?.id === user.id)) {
      throw new ForbiddenException(
        'Only course teacher or admin can add lessons',
      );
    }

    const lesson = this.lessonRepo.create({
      title: dto.title,
      content: dto.content,
      ordering: dto.ordering ?? 0,
      durationMinutes: dto.durationMinutes,
      course,
    });

    return this.lessonRepo.save(lesson);
  }

  public async findAll(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.lessonRepo.find({
      where: { course: { id: courseId } },
      order: { ordering: 'ASC' },
    });
  }

  public async findOne(courseId: string, id: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!lesson || lesson.course.id !== courseId)
      throw new NotFoundException('Lesson not found in course');
    return lesson;
  }

  public async update(
    courseId: string,
    id: string,
    dto: UpdateLessonDto,
    user: User,
  ) {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher'],
    });
    if (!lesson || lesson.course.id !== courseId)
      throw new NotFoundException('Lesson not found in course');

    if (
      !(user.role === UserRole.ADMIN || lesson.course.teacher?.id === user.id)
    ) {
      throw new ForbiddenException(
        'Only course teacher or admin can update lessons',
      );
    }

    Object.assign(lesson, dto);
    return this.lessonRepo.save(lesson);
  }

  public async remove(courseId: string, id: string, user: User) {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher'],
    });
    if (!lesson || lesson.course.id !== courseId)
      throw new NotFoundException('Lesson not found in course');

    if (
      !(user.role === UserRole.ADMIN || lesson.course.teacher?.id === user.id)
    ) {
      throw new ForbiddenException(
        'Only course teacher or admin can remove lessons',
      );
    }

    await this.lessonRepo.delete(id);
    return { deleted: true };
  }
}
