import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  INTIMACAO_ATRIBUIDA,
  IntimacaoAtribuidaEvent,
} from '../intimacoes/events/intimacao-atribuida.event.js';
import { NOTIFIERS, type Notifier } from './notifier.interface.js';

@Injectable()
export class NotificacaoListener {
  private readonly logger = new Logger(NotificacaoListener.name);

  constructor(@Inject(NOTIFIERS) private readonly notifiers: Notifier[]) {}

  // async: true roda depois da resposta, sem atrasar a distribuição
  @OnEvent(INTIMACAO_ATRIBUIDA, { async: true })
  async handleIntimacaoAtribuida(evento: IntimacaoAtribuidaEvent) {
    // Aqui SIM em paralelo: os canais são independentes, e o Discord fora
    // do ar não pode atrasar nem impedir o push no navegador
    const resultados = await Promise.allSettled(
      this.notifiers.map((notifier) => notifier.enviar(evento)),
    );

    resultados.forEach((resultado, i) => {
      if (resultado.status === 'rejected') {
        const erro: unknown = resultado.reason;
        this.logger.warn(
          `Falha no canal ${this.notifiers[i].nome} (intimação ${evento.intimacao.id})`,
          erro instanceof Error ? erro.stack : String(erro),
        );
      }
    });
  }
}
