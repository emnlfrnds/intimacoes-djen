import type { IntimacaoAtribuidaEvent } from '../intimacoes/events/intimacao-atribuida.event.js';

// Token de injeção: interfaces somem na compilação, então o Nest precisa de um valor real.
// É uma LISTA: o listener avisa todos os canais ligados em NOTIFICACAO_CANAIS
export const NOTIFIERS = Symbol('NOTIFIERS');

export interface Notifier {
  // Nome usado em NOTIFICACAO_CANAIS e nos logs
  readonly nome: string;
  // Recebe o evento inteiro: cada canal decide como formatar (texto, JSON...)
  enviar(evento: IntimacaoAtribuidaEvent): Promise<void>;
}
