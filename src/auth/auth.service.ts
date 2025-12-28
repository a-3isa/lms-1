import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRegisterDto } from './dto/auth-credentials.dto';
import { Repository } from 'typeorm';
import { genSalt, hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { User, UserRole } from 'src/user/entities/user.entity';
import { UserLoginDto } from 'src/user/dto/user-login.dto';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private rabbitMQService: RabbitMQService,
  ) {}

  public async register(createUserDto: UserRegisterDto): Promise<void> {
    const { username, email, password, role } = createUserDto;
    if (!role || role === UserRole.ADMIN) {
      throw new ConflictException('Invalid user role');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const salt: string = await genSalt();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const hashedPassword: string = await hash(password, salt);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      verified: false,
    });
    try {
      await this.userRepository.insert(user);
      // Send verification email
      const verificationToken = this.jwtService.sign(
        { email },
        { expiresIn: '1d' },
      );
      await this.rabbitMQService.sendVerificationEmail({
        email,
        username,
        verificationToken,
      });
    } catch (error) {
      if ((error as Record<string, unknown>).code === '23505') {
        throw new ConflictException('User exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  public async login(
    userLoginDto: UserLoginDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = userLoginDto;
    const user = await this.userRepository.findOne({ where: { username } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (user && (await compare(password, user.password)) && user.verified) {
      const payload: JwtPayload = { username };
      const accessToken: string = this.jwtService.sign(payload);
      return { accessToken };
    }
    throw new NotFoundException('User not found or not verified');
  }

  public async verifyUser(token: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { email: (payload as Record<string, unknown>).email as string },
      });
      if (user) {
        user.verified = true;
        await this.userRepository.save(user);
      }
    } catch {
      throw new NotFoundException('Invalid token');
    }
  }

  public async adminRegister(
    createUserDto: UserRegisterDto,
  ): Promise<{ accessToken: string }> {
    const { username, email, password } = createUserDto;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const salt: string = await genSalt();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const hashedPassword: string = await hash(password, salt);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      verified: true, // Admins are verified by default
    });
    try {
      await this.userRepository.insert(user);
      // Create cart for new user

      const payload: JwtPayload = { username };
      const accessToken: string = this.jwtService.sign(payload);
      return { accessToken };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
