/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
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
  ) {}

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

    const quiz = this.quizRepo.create({ title: dto.title, course });

    quiz.questions = dto.questions.map((qDto) => {
      const q = new Question();
      q.text = qDto.text;
      q.points = qDto.points ?? 1;
      q.options = qDto.options.map((opt) => {
        const o = new Option();
        o.text = opt.text;
        return o;
      });
      return q;
    });

    const saved = await this.quizRepo.save(quiz);

    for (let i = 0; i < (dto.questions?.length ?? 0); i++) {
      const qDto = dto.questions[i] as
        | CreateQuizDto['questions'][number]
        | undefined;
      const savedQ = saved.questions?.[i];
      if (!qDto || !savedQ) continue;
      const correctIdx = qDto.correctIndex ?? 0;
      const correctOption = savedQ.options?.[correctIdx];
      if (correctOption) {
        savedQ.correctOptionId = correctOption.id;
        await this.questionRepo.save(savedQ);
      }
    }

    return this.findOne(courseId, String(saved.id), user);
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
    const isOwnerOrAdmin = !!(
      user &&
      (user.role === UserRole.ADMIN ||
        (quiz.course?.teacher && quiz.course.teacher.id === user.id))
    );
    if (isOwnerOrAdmin) return quiz;

    const sanitizedQuestions: SanitizedQuestion[] = (quiz.questions ?? []).map(
      (q) => ({
        id: q.id,
        text: q.text,
        points: q.points ?? 1,
        options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
      }),
    );

    const clone: SanitizedQuiz = {
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: sanitizedQuestions,
    };
    return clone;
  }

  public async update(
    courseId: string,
    id: string,
    dto: UpdateQuizDto,
    user: User,
  ): Promise<Quiz | SanitizedQuiz> {
    const quiz = await this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'course.teacher', 'questions', 'questions.options'],
    });
    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');

    if (
      !(
        user.role === UserRole.ADMIN ||
        (quiz.course?.teacher && quiz.course.teacher.id === user.id)
      )
    ) {
      throw new ForbiddenException(
        'Only course owner or admin can update quizzes',
      );
    }

    if (dto.title) quiz.title = dto.title;

    if (dto.questions) {
      await this.questionRepo
        .createQueryBuilder()
        .delete()
        .where('quizId = :id', { id: quiz.id })
        .execute();

      quiz.questions = dto.questions.map((qDto) => {
        const q = new Question();
        q.text = (qDto as any)?.text ?? '';
        q.points = (qDto as any)?.points ?? 1;
        q.options = ((qDto as any)?.options ?? []).map((opt: any) => {
          const o = new Option();
          o.text = opt?.text ?? '';
          return o;
        });
        return q;
      });
    }

    const saved = await this.quizRepo.save(quiz);

    if (dto.questions) {
      for (let i = 0; i < (dto.questions?.length ?? 0); i++) {
        const qDto = dto.questions[
          i
        ] as UpdateQuizDto['questions'] extends Array<infer U> ? U : unknown;
        const savedQ = saved.questions?.[i];
        if (!qDto || !savedQ) continue;
        const correctIdx = (qDto as any).correctIndex ?? 0;
        const correctOption = savedQ.options?.[correctIdx];
        if (correctOption) {
          savedQ.correctOptionId = correctOption.id;
          await this.questionRepo.save(savedQ);
        }
      }
    }

    return this.findOne(courseId, String(saved.id), user);
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
      relations: ['questions', 'questions.options', 'course'],
    });
    if (!quiz || quiz.course.id !== courseId)
      throw new NotFoundException('Quiz not found in course');

    let total = 0;
    let score = 0;

    for (const q of (quiz.questions ?? []) as Question[]) {
      const points = q.points ?? 1;
      total += points;
      const qId = q.id as string | undefined;
      const selected = qId ? answers[qId] : undefined;
      const correctId = q.correctOptionId;
      if (
        typeof selected !== 'undefined' &&
        typeof correctId !== 'undefined' &&
        String(selected) === String(correctId)
      ) {
        score += points;
      }
    }

    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    const result = { totalPoints: total, scoredPoints: score, percent };

    // persist submission if progressService is available
    try {
      if (this.progressService) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.progressService.recordQuizSubmission(
          user,
          id,
          score,
          total,
          percent,
        );
      }
    } catch {
      // swallow persistence errors to not break quiz flow
    }

    return result;
  }
}
