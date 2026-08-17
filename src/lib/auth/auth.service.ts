import { Inject, Injectable } from '@nestjs/common';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import type { Auth } from './auth.js';
import { AUTH } from './auth.constants.js';

@Injectable()
export class AuthService {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  get handler() {
    return toNodeHandler(this.auth);
  }

  async getSession(nodeHeaders: IncomingHttpHeaders) {
    return this.auth.api.getSession({
      headers: fromNodeHeaders(nodeHeaders),
      returnHeaders: true,
    });
  }
}
