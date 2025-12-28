import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserLoginDto } from './user-login.dto';

export class UpdateUserDto extends PartialType(UserLoginDto) {
  @ApiPropertyOptional({
    minLength: 8,
    maxLength: 12,
    description: 'Old password for verification',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(12)
  oldPassword: string;
}
