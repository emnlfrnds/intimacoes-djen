import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { ColaboradorModule } from './colaborador/colaborador.module.js';
import { IntimacoesModule } from './intimacoes/intimacoes.module.js';
import { NotificacaoModule } from './notificacao/notificacao.module.js';
import { SegurancaModule } from './seguranca/seguranca.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

// Falha no boot, e não na primeira requisição, se a chave faltar ou for fraca
function validarAmbiente(env: Record<string, unknown>) {
  const apiKey = env.API_KEY;
  if (typeof apiKey !== 'string' || apiKey.length < 32) {
    throw new Error(
      'API_KEY ausente ou curta no .env (mínimo de 32 caracteres aleatórios)',
    );
  }
  return env;
}

@Module({
  imports: [
    // Precisa vir primeiro: carrega o .env antes do ObserveModule ler process.env
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'intimacoes-djen',
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASS'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // só para o hackathon; em produção usaríamos migrations
      }),
    }),
    ColaboradorModule,
    IntimacoesModule,
    NotificacaoModule,
    SegurancaModule,
  ],
})
export class AppModule {}
