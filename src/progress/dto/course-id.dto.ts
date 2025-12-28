import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CourseIdDto {
  @ApiProperty({ description: 'Course id (uuid)' })
  @IsUUID()
  courseId: string;
}
