import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth')) return next();
    return json()(req, res, next);
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
