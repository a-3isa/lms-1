import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { Option } from './option.entity';

@Entity('quiz_questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'text' })
  public text: string;

  @Column({ type: 'int', default: 1 })
  public points: number;

  @OneToMany(() => Option, (o) => o.question, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
  })
  options: Option[];



  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  public quiz: Quiz;
}
