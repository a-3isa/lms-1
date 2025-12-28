import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/user/entities/user.entity';

export class UserRegisterDto {
  @ApiProperty({
    required: true,
    minLength: 4,
    maxLength: 12,
    description: 'Username ',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  public username: string;

  @ApiProperty({
    required: true,
    minLength: 4,
    maxLength: 12,
    description: 'Role ',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  public role: UserRole;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  public email: string;

  @ApiProperty({ minLength: 8, maxLength: 12, description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password is too weak',
  })
  public password: string;
}
