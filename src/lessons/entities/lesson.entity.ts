import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 200 })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public content?: string;

  @Column({ type: 'int', default: 0 })
  public ordering: number;

  @Column({ type: 'float', nullable: true })
  public durationMinutes?: number;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  public course: Course;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
