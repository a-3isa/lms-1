import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

export const UserRole = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 100 })
  public username: string;

  @Column({ unique: true })
  public email: string;

  @Column()
  public password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  public role: UserRole;

  @Column({ default: false })
  public verified: boolean;

  @ManyToMany(() => Course, (course) => course.students)
  public enrolledCourses?: Course[];

  @OneToMany(() => Course, (course) => course.teacher)
  public coursesTaught?: Course[];
}
