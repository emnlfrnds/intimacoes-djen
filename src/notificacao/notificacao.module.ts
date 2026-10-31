import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordNotifier } from './discord.notifier.js';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoListener } from './notificacao.listener.js';
import { NOTIFIERS, type Notifier } from './notifier.interface.js';
import { SseNotifier } from './sse.notifier.js';

@Module({
  controllers: [NotificacaoController],
  providers: [
    SseNotifier,
    DiscordNotifier,
    NotificacaoListener,
    // Trocar ou somar canal é só configuração: NOTIFICACAO_CANAIS=sse,discord.
    // Distribuição e listener não mudam (para um Telegram: nova classe + uma linha aqui)
    {
      provide: NOTIFIERS,
      inject: [ConfigService, SseNotifier, DiscordNotifier],
      useFactory: (
        config: ConfigService,
        sse: SseNotifier,
        discord: DiscordNotifier,
      ): Notifier[] => {
        const logger = new Logger('NotificacaoModule');
        const canais = config
          .get<string>('NOTIFICACAO_CANAIS', 'sse')
          .split(',')
          .map((canal) => canal.trim());

        if (canais.includes(discord.nome) && !discord.configurado) {
          logger.warn('Canal discord ignorado: DISCORD_WEBHOOK_URL vazia');
        }
        const ativos = [sse, discord].filter(
          (notifier) =>
            canais.includes(notifier.nome) &&
            (notifier !== discord || discord.configurado),
        );
        logger.log(
          `Canais de notificação: ${ativos.map((n) => n.nome).join(', ') || 'nenhum'}`,
        );
        return ativos;
      },
    },
  ],
})
export class NotificacaoModule {}
