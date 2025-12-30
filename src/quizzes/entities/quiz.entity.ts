import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Question } from './question.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 200 })
  public title: string;

  @ManyToOne(() => Course, (c) => c.lessons, { nullable: false })
  public course: Course;

  @OneToMany(() => Question, (q) => q.quiz, { cascade: true })
  public questions: Question[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}

