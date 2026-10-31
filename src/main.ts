import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
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
