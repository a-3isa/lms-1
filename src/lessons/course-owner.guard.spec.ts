import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Repository } from 'typeorm';
import { CourseOwnerGuard } from './course-owner.guard';
import { Course } from '../courses/entities/course.entity';
import { CoursesController } from '../courses/courses.controller';

describe('CourseOwnerGuard', () => {
  const course = { id: 'c1', teacher: { id: 'teacher-1' } };
  const courses = {
    findOne: jest.fn().mockResolvedValue(course),
  } as unknown as Repository<Course>;
  const guard = new CourseOwnerGuard(courses);
  const contextFor = (user: unknown, params: Record<string, string>) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    }) as unknown as ExecutionContext;

  it('reads the course from :id on course routes', async () => {
    await expect(
      guard.canActivate(
        contextFor({ id: 'teacher-1', role: 'teacher' }, { id: 'c1' }),
      ),
    ).resolves.toBe(true);
    expect(courses.findOne).toHaveBeenCalledWith({
      where: { id: 'c1' },
      relations: ['teacher'],
    });
  });

  it('refuses users who do not teach the course', async () => {
    await expect(
      guard.canActivate(
        contextFor({ id: 'student-1', role: 'student' }, { id: 'c1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admits admins', async () => {
    await expect(
      guard.canActivate(
        contextFor({ id: 'admin-1', role: 'admin' }, { courseId: 'c1' }),
      ),
    ).resolves.toBe(true);
  });

  it.each(['update', 'remove'] as const)(
    'guards CoursesController.%s',
    (method) => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        CoursesController.prototype[method],
      ) as unknown[];
      expect(guards).toContain(CourseOwnerGuard);
    },
  );
});
