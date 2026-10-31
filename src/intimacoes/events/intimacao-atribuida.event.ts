import type { Colaborador } from '../../colaborador/entities/colaborador.entity.js';
import type { Intimacao } from '../entities/intimacao.entity.js';

// Nome do evento em uma constante: quem emite e quem escuta usam a mesma string
export const INTIMACAO_ATRIBUIDA = 'intimacao.atribuida';

export class IntimacaoAtribuidaEvent {
  constructor(
    public readonly intimacao: Intimacao,
    public readonly colaborador: Colaborador,
  ) {}
}
