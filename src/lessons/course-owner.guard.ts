import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CourseOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: User; params?: Record<string, string> }>();
    const user = req.user;
    const courseId = req.params?.courseId;

    if (!courseId) {
      throw new NotFoundException('Course id param missing');
    }

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (!user) throw new ForbiddenException('No user in request');

    // allow admins
    if (user.role === 'admin') return true;

    if (!course.teacher)
      throw new ForbiddenException('Course has no teacher assigned');

    if (course.teacher.id !== user.id) {
      throw new ForbiddenException('Only course owner can perform this action');
    }

    return true;
  }
}
