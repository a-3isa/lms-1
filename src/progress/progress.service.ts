import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress } from './entities/lesson-progress.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonProgress)
    private readonly lessonProgressRepo: Repository<LessonProgress>,
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionRepo: Repository<QuizSubmission>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
  ) { }

  public async markLessonComplete(user: User, lessonId: string) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['course'],
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.lessonProgressRepo
      .createQueryBuilder('lp')
      .leftJoin('lp.user', 'user')
      .leftJoin('lp.lesson', 'lesson')
      .where('user.id = :userId', { userId: user.id })
      .andWhere('lesson.id = :lessonId', { lessonId })
      .getOne();

    if (existing) return existing;

    const rec = this.lessonProgressRepo.create({ user, lesson });
    return this.lessonProgressRepo.save(rec);
  }

  public async markLessonIncomplete(user: User, lessonId: string) {
    const existing = await this.lessonProgressRepo
      .createQueryBuilder('lp')
      .leftJoin('lp.user', 'user')
      .leftJoin('lp.lesson', 'lesson')
      .where('user.id = :userId', { userId: user.id })
      .andWhere('lesson.id = :lessonId', { lessonId })
      .getOne();

    if (!existing) throw new NotFoundException('Lesson progress not found');
    await this.lessonProgressRepo.delete(existing.id);
    return { deleted: true };
  }

  public async recordQuizSubmission(
    user: User,
    quizId: string,
    scoredPoints: number,
    totalPoints: number,
    percent: number,
    answers: Record<string, string>,
  ) {
    const quiz = await this.quizRepo.findOne({
      where: { id: quizId },
      relations: ['course'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const rec = this.quizSubmissionRepo.create({
      user,
      quiz,
      scoredPoints,
      totalPoints,
      percent,
      answers,
    });
    return this.quizSubmissionRepo.save(rec);
  }

  public async getCourseProgress(user: User, courseId: string) {
    const lessons = await this.lessonProgressRepo
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.lesson', 'lesson')
      .leftJoin('lesson.course', 'course')
      .leftJoin('lp.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .andWhere('course.id = :courseId', { courseId })
      .getMany();

    const quizzes = await this.quizSubmissionRepo
      .createQueryBuilder('qs')
      .leftJoinAndSelect('qs.quiz', 'quiz')
      .leftJoin('quiz.course', 'course')
      .leftJoin('qs.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .andWhere('course.id = :courseId', { courseId })
      .getMany();

    return {
      lessonsCompleted: lessons.map((l) => ({
        lessonId: l.lesson.id,
        completedAt: l.completedAt,
      })),
      quizSubmissions: quizzes.map((q) => ({
        id: q.id,
        quizId: q.quiz.id,
        scoredPoints: q.scoredPoints,
        totalPoints: q.totalPoints,
        percent: q.percent,
        createdAt: q.createdAt,
      })),
    };
  }
}
