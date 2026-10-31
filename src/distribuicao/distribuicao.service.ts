import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { Colaborador } from '../colaborador/entities/colaborador.entity.js';
import {
  Intimacao,
  StatusIntimacao,
} from '../intimacoes/entities/intimacao.entity.js';
import {
  INTIMACAO_ATRIBUIDA,
  IntimacaoAtribuidaEvent,
} from '../intimacoes/events/intimacao-atribuida.event.js';

@Injectable()
export class DistribuicaoService {
  private readonly logger = new Logger(DistribuicaoService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Devolve true se atribuiu. Escolha + gravação na MESMA transação
  async distribuir(intimacaoId: number): Promise<boolean> {
    const evento = await this.dataSource.transaction(async (manager) => {
      // Trava os colaboradores ativos até o COMMIT. Outro sync que chegue agora
      // espera aqui e só conta as filas depois desta atribuição gravada.
      // (Não dá para pôr o FOR UPDATE na própria contagem: o Postgres não aceita
      // FOR UPDATE junto com GROUP BY.)
      await manager
        .createQueryBuilder(Colaborador, 'colaborador')
        .select('colaborador.id')
        .where('colaborador.ativo = :ativo', { ativo: true })
        .setLock('pessimistic_write')
        .getMany();

      const colaborador = await this.escolherColaborador(manager);
      if (!colaborador) return null;

      // "colaboradorId IS NULL": se outra chamada já atribuiu, não atribui de novo
      const { affected } = await manager
        .createQueryBuilder()
        .update(Intimacao)
        .set({ colaborador: { id: colaborador.id } })
        .where('id = :id', { id: intimacaoId })
        .andWhere('"colaboradorId" IS NULL')
        .execute();
      if (!affected) return null;

      const intimacao = await manager.findOneByOrFail(Intimacao, {
        id: intimacaoId,
      });
      const tamanhoFila = await manager.countBy(Intimacao, {
        colaborador: { id: colaborador.id },
        status: StatusIntimacao.PENDENTE,
      });
      return new IntimacaoAtribuidaEvent(intimacao, colaborador, tamanhoFila);
    });

    if (!evento) {
      this.logger.warn(
        `Intimação ${intimacaoId} sem atribuição (nenhum colaborador ativo ou já atribuída)`,
      );
      return false;
    }

    // Só DEPOIS do commit: se a transação desfizesse, ninguém recebe alerta falso
    this.eventEmitter.emit(INTIMACAO_ATRIBUIDA, evento);
    return true;
  }

  // Query do projeto base: menor número de PENDENTES; empate vai para o menor id
  private escolherColaborador(manager: EntityManager) {
    return manager
      .createQueryBuilder(Colaborador, 'colaborador')
      .leftJoin(
        'colaborador.intimacoes',
        'intimacao',
        'intimacao.status = :status',
        { status: StatusIntimacao.PENDENTE },
      )
      .where('colaborador.ativo = :ativo', { ativo: true })
      .groupBy('colaborador.id')
      .orderBy('COUNT(intimacao.id)', 'ASC')
      .addOrderBy('colaborador.id', 'ASC')
      .limit(1)
      .getOne();
  }
}
