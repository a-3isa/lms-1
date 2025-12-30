import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { Option } from './entities/option.entity';
import { Course } from '../courses/entities/course.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import type { ProgressService } from '../progress/progress.service';

type SanitizedQuestion = {
  id: string;
  text: string;
  points: number;
  options: { id: string; text: string }[];
};

type SanitizedQuiz = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: SanitizedQuestion[];
};

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepo: Repository<Option>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly progressService?: ProgressService,
  ) { }

  public async create(
    courseId: string,
    dto: CreateQuizDto,
    user: User,
  ): Promise<Quiz | SanitizedQuiz> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (!(user.role === UserRole.ADMIN || course.teacher?.id === user.id)) {
      throw new ForbiddenException(
        'Only course owner or admin can create quizzes',
      );
    }

    const quiz = this.quizRepo.create({
      title: dto.title,
      course,
      questions: dto.questions.map((q) => ({
        text: q.text,
        points: q.points ?? 1,
        options: q.options.map((o) => ({
          text: o.text,
          isCorrect: !!o.isCorrect,
        })),
      })),
    });

    const savedQuiz = await this.quizRepo.save(quiz);

    return this.findOne(courseId, String(savedQuiz.id), user);
  }

  public async findAll(
    courseId: string,
    user?: User,
  ): Promise<Array<Quiz | SanitizedQuiz>> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['teacher'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const quizzes = await this.quizRepo.find({
      where: { course: { id: courseId } },
      relations: ['questions', 'questions.options', 'course', 'course.teacher'],
    });

    return quizzes.map((q) => this.sanitizeQuizForUser(q, user));
  }

  public async findOne(
    courseId: string,
    id: string,
    user?: User,
  ): Promise<Quiz | SanitizedQuiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'course', 'course.teacher'],
    });
    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');
    return this.sanitizeQuizForUser(quiz, user);
  }

  private sanitizeQuizForUser(quiz: Quiz, user?: User): Quiz | SanitizedQuiz {
    const isOwnerOrAdmin =
      user?.role === UserRole.ADMIN ||
      quiz.course?.teacher?.id === user?.id;

    if (isOwnerOrAdmin) return quiz;

    return {
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions?.map((q) => ({
        id: q.id,
        text: q.text,
        points: q.points ?? 1,
        options: q.options?.map((o) => ({
          id: o.id,
          text: o.text,
        })),
      })),
    };
  }


  public async update(
    courseId: string,
    id: string,
    dto: UpdateQuizDto,
    user: User,
  ): Promise<Quiz | SanitizedQuiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher'],
    });

    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');

    if (
      user.role !== UserRole.ADMIN &&
      quiz.course.teacher?.id !== user.id
    )
      throw new ForbiddenException('Not allowed');

    Object.assign(quiz, { title: dto.title ?? quiz.title });

    if (dto.questions) {
      await this.questionRepo.delete({ quiz: { id: quiz.id } });

      quiz.questions = dto.questions.map((q) =>
        this.questionRepo.create({
          text: q.text,
          points: q.points ?? 1,
          options: (q.options ?? []).map((o) =>
            this.optionRepo.create({
              text: o.text,
              isCorrect: !!o.isCorrect,
            }),
          ),
        }),
      );
    }

    await this.quizRepo.save(quiz);

    return this.findOne(courseId, id, user);
  }


  public async remove(
    courseId: string,
    id: string,
    user: User,
  ): Promise<{ deleted: true }> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher'],
    });
    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');

    if (
      !(user.role === UserRole.ADMIN || quiz.course.teacher?.id === user.id)
    ) {
      throw new ForbiddenException(
        'Only course owner or admin can delete quizzes',
      );
    }

    await this.quizRepo.delete(id);
    return { deleted: true };
  }

  public async submit(
    courseId: string,
    id: string,
    user: User,
    answers: Record<string, string>,
  ): Promise<{ totalPoints: number; scoredPoints: number; percent: number }> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['questions', 'course'],
    });

    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');

    let totalPoints = 0;
    let scoredPoints = 0;

    for (const q of quiz.questions ?? []) {
      const points = q.points ?? 1;
      totalPoints += points;

      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const correctOption = q.options.find((o) => o.isCorrect);
        // Verify selection matches correct option ID
        if (correctOption && correctOption.id === selectedOptionId) {
          scoredPoints += points;
        }
      }
    }

    const percent = totalPoints
      ? Math.round((scoredPoints / totalPoints) * 100)
      : 0;

    if (this.progressService) {
      try {
        this.progressService.recordQuizSubmission(
          user,
          id,
          scoredPoints,
          totalPoints,
          percent,
          answers,
        );
      } catch { }
    }

    return { totalPoints, scoredPoints, percent };
  }


}
