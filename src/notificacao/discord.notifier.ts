import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntimacaoAtribuidaEvent } from '../intimacoes/events/intimacao-atribuida.event.js';
import { Notifier } from './notifier.interface.js';

@Injectable()
export class DiscordNotifier implements Notifier {
  readonly nome = 'discord';

  constructor(private readonly config: ConfigService) {}

  get configurado(): boolean {
    return Boolean(this.config.get<string>('DISCORD_WEBHOOK_URL'));
  }

  async enviar({
    intimacao,
    colaborador,
    tamanhoFila,
  }: IntimacaoAtribuidaEvent): Promise<void> {
    const url = this.config.getOrThrow<string>('DISCORD_WEBHOOK_URL');
    const mensagem = [
      '📌 **Nova intimação atribuída**',
      `Processo: ${intimacao.numeroProcessoMascara} (${intimacao.siglaTribunal})`,
      `Tipo: ${intimacao.tipoComunicacao}`,
      `Colaborador: ${colaborador.nome} (fila: ${tamanhoFila})`,
    ].join('\n');

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // parse: [] desliga @everyone/@here: o texto mistura dados vindos de fora
      body: JSON.stringify({
        content: mensagem,
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!resposta.ok) {
      throw new Error(`Discord respondeu HTTP ${resposta.status}`);
    }
  }
}
