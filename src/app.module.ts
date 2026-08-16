import { ArcjetModule, shield, slidingWindow } from '@arcjet/nest';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ArcjetGuard }],
})
export class AppModule {}
