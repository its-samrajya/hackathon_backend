import { ARCJET, type ArcjetNest } from '@arcjet/nest';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ArcjetGuard implements CanActivate {
  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const decision = await this.arcjet.protect(request);

    if (decision.isDenied()) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
