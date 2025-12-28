import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';

@Entity('lesson_progress')
@Unique(['user', 'lesson'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => User, { eager: true })
  public user: User;

  @ManyToOne(() => Lesson, { eager: true, onDelete: 'CASCADE' })
  public lesson: Lesson;

  @CreateDateColumn()
  public completedAt: Date;
}
