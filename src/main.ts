import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  // Front sem build: public/index.html servido em "/" pelo próprio Nest
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que o DTO não declara
      forbidNonWhitelisted: true, // e responde 400 se vierem
      transform: true, // entrega ao controller uma instância do DTO
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
