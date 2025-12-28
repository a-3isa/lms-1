import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();

      const { pathname } = new URL(
        request.url,
        `http://${request.headers.host}`,
      );
      const method: string = request.method;
      const negUrls = ['/auth/register', '/auth/login', '/auth/verify'];

      // ✅ Bypass guard for /auth/login (and optionally method)
      if (negUrls.includes(pathname) && method === 'POST') {
        return true;
      }

      // ✅ Continue with default JWT validation
      return (await super.canActivate(context)) as boolean;
    } else {
      return true;
    }
  }
}
