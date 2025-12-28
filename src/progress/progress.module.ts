import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { LessonProgress } from './entities/lesson-progress.entity';
import { QuizSubmission } from './entities/quiz-submission.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LessonProgress, QuizSubmission, Lesson, Quiz]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
