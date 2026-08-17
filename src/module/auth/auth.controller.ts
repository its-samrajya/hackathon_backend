import { All, Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../../common/guards/auth.guard.js';
import { AuthService } from '../../lib/auth/auth.service.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('api/auth/{*splat}')
  handle(@Req() req: Request, @Res() res: Response) {
    return this.authService.handler(req, res);
  }

  @Get('auth/me')
  @UseGuards(AuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
