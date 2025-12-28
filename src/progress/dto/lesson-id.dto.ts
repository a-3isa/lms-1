import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LessonIdDto {
  @ApiProperty({ description: 'Lesson id (uuid)' })
  @IsUUID()
  lessonId: string;
}
