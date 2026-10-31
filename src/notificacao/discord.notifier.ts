import { Injectable } from '@nestjs/common';
import { Notifier } from './notifier.interface.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordNotifier implements Notifier {
  constructor(private readonly config: ConfigService) {}

  async enviar(mensagem: string): Promise<void> {
    const url = this.config.getOrThrow<string>('DISCORD_WEBHOOK_URL');

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ content: mensagem }),
      signal: AbortSignal.timeout(5000),
    });

    if (!resposta.ok) {
      throw new Error(
        `Discord respondeu ${resposta.status}: ${await resposta.text()}`,
      );
    }
  }
}
