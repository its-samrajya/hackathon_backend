import { Global, Module } from '@nestjs/common';
import { createAuth } from './auth.js';
import { AUTH } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Global()
@Module({
  providers: [
    {
      provide: AUTH,
      useFactory: (prisma: PrismaService) => createAuth(prisma),
      inject: [PrismaService],
    },
    AuthService,
  ],
  exports: [AUTH, AuthService],
})
export class AuthModule {}
