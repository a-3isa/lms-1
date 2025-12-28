import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash, genSalt } from 'bcrypt';

import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  public async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async update(user: User, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      if (!updateUserDto.oldPassword) {
        throw new BadRequestException(
          'Old password is required to set a new password',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (!(await compare(updateUserDto.oldPassword, user.password))) {
        throw new ConflictException('Old password does not match');
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (await compare(updateUserDto.password, user.password)) {
        throw new ConflictException(
          'New password cannot be the same as the current password',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const salt: string = await genSalt();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      updateUserDto.password = await hash(updateUserDto.password, salt);
    }
    const updateData = { ...updateUserDto };

    await this.userRepository.update(user.id, updateData);
    return this.findOne(user.id);
  }

  public async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  public async getMe(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['cart', 'cart.items', 'cart.items.productVariant'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
