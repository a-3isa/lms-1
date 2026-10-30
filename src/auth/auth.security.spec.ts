import {
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RoleGuard } from './roles.guard';
import { User, UserRole } from 'src/user/entities/user.entity';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

const repo = (overrides: Partial<Record<keyof Repository<User>, jest.Mock>>) =>
  ({
    findOne: jest.fn(),
    existsBy: jest.fn().mockResolvedValue(false),
    insert: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x: unknown) => x),
    ...overrides,
  }) as unknown as Repository<User> & Record<string, jest.Mock>;

describe('JwtStrategy.validate', () => {
  const config = { get: () => 'test-secret' } as unknown as ConfigService;

  it('rejects a token without a username, such as a verification token', async () => {
    const users = repo({
      findOne: jest.fn().mockResolvedValue({ id: 'first' }),
    });
    const strategy = new JwtStrategy(users, config);

    await expect(
      strategy.validate({ email: 'someone@example.com' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('looks the user up by username', async () => {
    const user = { id: 'u1', username: 'alice' };
    const users = repo({ findOne: jest.fn().mockResolvedValue(user) });
    const strategy = new JwtStrategy(users, config);

    await expect(strategy.validate({ username: 'alice' })).resolves.toBe(user);
    expect(users.findOne).toHaveBeenCalledWith({
      where: { username: 'alice' },
    });
  });
});

describe('AuthService', () => {
  const make = (users: Repository<User>, verify: () => unknown) =>
    new AuthService(
      users,
      { verify, sign: () => 'token' } as unknown as JwtService,
      { sendVerificationEmail: jest.fn() } as unknown as RabbitMQService,
    );

  it('does not verify anyone with a token that has no email', async () => {
    const users = repo({
      findOne: jest.fn().mockResolvedValue({ id: 'first' }),
    });
    const auth = make(users, () => ({ username: 'alice' }));

    await expect(auth.verifyUser('login-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(users.findOne).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('refuses to register a username that is taken', async () => {
    const users = repo({ existsBy: jest.fn().mockResolvedValue(true) });
    const auth = make(users, () => ({}));

    await expect(
      auth.register({
        username: 'alice',
        email: 'other@example.com',
        password: 'Passw0rd1',
        role: UserRole.STUDENT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.insert).not.toHaveBeenCalled();
  });
});

describe('RoleGuard', () => {
  const contextFor = (user: unknown, roles?: string[]) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => (roles ? { roles } : {}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;
  const reflector = {
    get: (_key: string, target: { roles?: string[] }) => target.roles,
  } as unknown as Reflector;
  const guard = new RoleGuard(reflector);

  it('admits only admins when no roles are declared', () => {
    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
    expect(() =>
      guard.canActivate(contextFor({ role: UserRole.STUDENT })),
    ).toThrow(ForbiddenException);
  });

  it('admits the declared roles', () => {
    expect(
      guard.canActivate(
        contextFor({ role: UserRole.TEACHER }, [UserRole.TEACHER]),
      ),
    ).toBe(true);
  });

  it('guards POST /auth/adminRegister', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.adminRegister,
    ) as unknown[];
    expect(guards).toContain(RoleGuard);
  });
});
