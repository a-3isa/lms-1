import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 200 })
  public title: string;

  @Column({ type: 'text' })
  public description: string;

  @Column({ type: 'float', default: 0 })
  public price: number;

  @Column({ default: false })
  public published: boolean;

  @ManyToOne(() => User, (user) => user.coursesTaught, { nullable: true })
  public teacher?: User;

  @ManyToMany(() => User, (user) => user.enrolledCourses)
  @JoinTable({ name: 'course_enrollments' })
  public students?: User[];

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  public lessons?: Lesson[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
