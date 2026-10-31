import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Colaborador } from '../colaborador/entities/colaborador.entity.js';
import { StatusIntimacao } from '../intimacoes/entities/intimacao.entity.js';

@Injectable()
export class DistribuicaoService {
  constructor(
    @InjectRepository(Colaborador)
    private readonly colaboradorRepository: Repository<Colaborador>,
  ) {}

  escolherColaborador(): Promise<Colaborador | null> {
    return this.colaboradorRepository
      .createQueryBuilder('colaborador')
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
