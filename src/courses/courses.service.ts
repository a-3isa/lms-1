import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  public async create(createCourseDto: CreateCourseDto, user: User) {
    const course = this.courseRepo.create({
      title: createCourseDto.title,
      description: createCourseDto.description,
      price: createCourseDto.price ?? 0,
      published: createCourseDto.published ?? false,
      teacher: user,
    });

    return this.courseRepo.save(course);
  }

  public async findAll(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    let limit =
      pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;

    if (limit > 100) limit = 100;

    const [items, total] = await this.courseRepo.findAndCount({
      relations: ['teacher', 'students'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async findOne(id: string) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['teacher', 'students'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  public async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    Object.assign(course, updateCourseDto);
    return this.courseRepo.save(course);
  }

  public async remove(id: string) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    await this.courseRepo.delete(id);
    return { deleted: true };
  }

  public async enroll(courseId: string, user: User) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['students'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (!course.students) course.students = [];

    if (course.students.find((s) => s.id === user.id)) {
      throw new BadRequestException('User already enrolled');
    }

    course.students.push(user);
    return this.courseRepo.save(course);
  }

  public async unenroll(courseId: string, user: User) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['students'],
    });
    if (!course) throw new NotFoundException('Course not found');

    course.students = (course.students || []).filter((s) => s.id !== user.id);
    return this.courseRepo.save(course);
  }
}
