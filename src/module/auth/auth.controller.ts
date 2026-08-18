import { All, Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AuthService } from '../../lib/auth/auth.service.js';
import type { AuthenticatedRequest } from '../../common/guards/auth.guard.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowAnonymous()
  @All('api/auth/{*splat}')
  handle(@Req() req: Request, @Res() res: Response) {
    return this.authService.handler(req, res);
  }

  @Get('auth/me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
