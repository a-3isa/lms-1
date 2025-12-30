import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';

@Entity('quiz_submissions')
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => User, { eager: true })
  public user: User;

  @ManyToOne(() => Quiz, { eager: true, onDelete: 'CASCADE' })
  public quiz: Quiz;

  @Column({ type: 'float' })
  public scoredPoints: number;

  @Column({ type: 'float' })
  public totalPoints: number;

  @Column({ type: 'simple-json', nullable: true })
  public answers: Record<string, string>;

  @Column({ type: 'int' })
  public percent: number;

  @CreateDateColumn()
  public createdAt: Date;
}
