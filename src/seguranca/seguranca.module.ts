import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiKeyGuard } from './api-key.guard.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    // Padrão: 120 requisições por minuto por IP. Rotas sensíveis apertam com @Throttle
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  controllers: [AuthController],
  providers: [
    // A ordem importa: o limite roda ANTES da autenticação, então tentativas
    // com chave errada também contam (e são barradas com 429)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class SegurancaModule {}
