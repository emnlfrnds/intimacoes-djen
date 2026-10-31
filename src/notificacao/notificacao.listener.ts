import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  INTIMACAO_ATRIBUIDA,
  IntimacaoAtribuidaEvent,
} from '../intimacoes/events/intimacao-atribuida.event.js';
import { NOTIFIER, type Notifier } from './notifier.interface.js';

@Injectable()
export class NotificacaoListener {
  private readonly logger = new Logger(NotificacaoListener.name);

  constructor(@Inject(NOTIFIER) private readonly notifier: Notifier) {}

  // async: true roda o listener depois da resposta, sem atrasar o POST
  @OnEvent(INTIMACAO_ATRIBUIDA, { async: true })
  async handleIntimacaoAtribuida({
    intimacao,
    colaborador,
  }: IntimacaoAtribuidaEvent) {
    const mensagem = [
      '📌 **Nova intimação atribuída**',
      `Processo: ${intimacao.numeroProcesso}`,
      `Colaborador: ${colaborador.nome}`,
    ].join('\n');

    try {
      await this.notifier.enviar(mensagem);
      this.logger.log(`Alerta enviado: processo ${intimacao.numeroProcesso}`);
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar alerta do processo ${intimacao.numeroProcesso}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
