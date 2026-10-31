import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseNotifier } from './sse.notifier.js';

@Controller('notificacoes')
export class NotificacaoController {
  constructor(private readonly sseNotifier: SseNotifier) {}

  // Server-Sent Events: conexão HTTP aberta, o servidor empurra cada evento.
  // O EventSource do navegador reconecta sozinho se a conexão cair
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.sseNotifier.stream();
  }
}
