import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule, ObserveInstrument } from './app.module.js';
import { hashesInline } from './seguranca/csp.js';

const PASTA_PUBLICA = join(process.cwd(), 'public');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = app.get(ConfigService);
  const producao = config.get<string>('NODE_ENV') === 'production';

  // Cabeçalhos de segurança (CSP, X-Frame-Options, nosniff, HSTS...). Precisa
  // vir antes do static para valer também no index.html
  const { scripts, estilos } = hashesInline(join(PASTA_PUBLICA, 'index.html'));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", ...scripts],
          styleSrc: ["'self'", ...estilos],
          // Em http://localhost isso tentaria trocar as chamadas para https
          upgradeInsecureRequests: producao ? [] : null,
        },
      },
    }),
  );

  // CORS restrito: só as origens listadas podem chamar a API pelo navegador
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGENS', 'http://localhost:3000')
      .split(',')
      .map((origem) => origem.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
  });

  // Front sem build: public/index.html servido em "/" pelo próprio Nest
  app.useStaticAssets(PASTA_PUBLICA);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que o DTO não declara
      forbidNonWhitelisted: true, // e responde 400 se vierem
      transform: true, // entrega ao controller uma instância do DTO
    }),
  );
  await app.listen(config.get<string>('PORT') ?? 3000);
}
await bootstrap();
