// role.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found');
    }

    const allowedRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    ) ||
      this.reflector.get<UserRole[]>('roles', context.getClass()) || [
        UserRole.ADMIN,
      ];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }
}
