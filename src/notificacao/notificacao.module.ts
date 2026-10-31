import { Module } from '@nestjs/common';
import { NotificacaoListener } from './notificacao.listener.js';
import { NOTIFIER } from './notifier.interface.js';
import { DiscordNotifier } from './discord.notifier.js';

@Module({
  providers: [
    NotificacaoListener,
    // Para trocar por Telegram: useClass: TelegramNotifier (só está linha muda)
    { provide: NOTIFIER, useClass: DiscordNotifier },
  ],
})
export class NotificacaoModule {}
