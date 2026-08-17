import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Session } from '../../lib/auth/auth.js';
import { AuthService } from '../../lib/auth/auth.service.js';

export type AuthenticatedRequest = Request & { user: Session['user'] };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const { headers, response: session } = await this.authService.getSession(
      request.headers,
    );

    for (const cookie of headers.getSetCookie()) {
      response.append('Set-Cookie', cookie);
    }

    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    request.user = session.user;
    return true;
  }
}
