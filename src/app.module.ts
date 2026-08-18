import { ArcjetModule, shield, slidingWindow } from '@arcjet/nest';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';
import { AUTH } from './lib/auth/auth.constants.js';
import { AuthModule } from './lib/auth/auth.module.js';
import type { Auth } from './lib/auth/auth.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { AuthModule as AuthFeatureModule } from './module/auth/auth.module.js';
import { UserModule } from './module/user/user.module.js';
import { HackathonModule } from './module/hackathon/hackathon.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    AuthFeatureModule,
    BetterAuthModule.forRootAsync({
      isGlobal: true,
      useFactory: (auth: Auth) => ({ auth }),
      inject: [AUTH],
    }),
    UserModule,
    ArcjetModule.forRoot({
      isGlobal: true,
      key: process.env.ARCJET_KEY!,
      rules: [
        shield({ mode: 'LIVE' }),
        slidingWindow({
          mode: 'LIVE',
          interval: process.env.ARCJET_RATE_LIMIT_INTERVAL ?? '1m',
          max: Number(process.env.ARCJET_RATE_LIMIT_MAX ?? 100),
        }),
      ],
    }),
    HackathonModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ArcjetGuard }],
})
export class AppModule {}
