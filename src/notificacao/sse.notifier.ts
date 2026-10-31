import { Injectable, type MessageEvent, OnModuleDestroy } from '@nestjs/common';
import { interval, map, merge, Observable, Subject } from 'rxjs';
import {
  INTIMACAO_ATRIBUIDA,
  IntimacaoAtribuidaEvent,
} from '../intimacoes/events/intimacao-atribuida.event.js';
import { paraVisao } from '../intimacoes/intimacao.visao.js';
import { Notifier } from './notifier.interface.js';

// Evento "ping" a cada 25s: impede proxies de fecharem a conexão parada
const INTERVALO_PING_MS = 25_000;

@Injectable()
export class SseNotifier implements Notifier, OnModuleDestroy {
  readonly nome = 'sse';

  // Subject é multicast: um evento chega a TODOS os navegadores conectados
  private readonly eventos = new Subject<MessageEvent>();

  enviar({
    intimacao,
    colaborador,
    tamanhoFila,
  }: IntimacaoAtribuidaEvent): Promise<void> {
    this.eventos.next({
      type: INTIMACAO_ATRIBUIDA,
      id: String(intimacao.id),
      data: {
        ...paraVisao(intimacao),
        colaborador: { id: colaborador.id, nome: colaborador.nome },
        tamanhoFila,
      },
    });
    return Promise.resolve();
  }

  // Um Observable por conexão; o Nest cancela a inscrição quando a aba fecha
  stream(): Observable<MessageEvent> {
    const ping = interval(INTERVALO_PING_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
    );
    return merge(this.eventos.asObservable(), ping);
  }

  onModuleDestroy() {
    this.eventos.complete();
  }
}
