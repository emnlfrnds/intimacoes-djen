import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusIntimacao } from '../intimacoes/entities/intimacao.entity.js';
import { Colaborador } from './entities/colaborador.entity.js';

@Injectable()
export class ColaboradorService {
  constructor(
    @InjectRepository(Colaborador)
    private readonly colaboradorRepository: Repository<Colaborador>,
  ) {}

  // Mesmo LEFT JOIN da distribuição, mas devolvendo a fila de todos (cards do front)
  async listarComFila() {
    const linhas = await this.colaboradorRepository
      .createQueryBuilder('colaborador')
      .leftJoin(
        'colaborador.intimacoes',
        'intimacao',
        'intimacao.status = :status',
        { status: StatusIntimacao.PENDENTE },
      )
      .select('colaborador.id', 'id')
      .addSelect('colaborador.nome', 'nome')
      .addSelect('colaborador.ativo', 'ativo')
      .addSelect('COUNT(intimacao.id)', 'pendentes')
      .groupBy('colaborador.id')
      .orderBy('colaborador.id', 'ASC')
      .getRawMany<{
        id: number;
        nome: string;
        ativo: boolean;
        pendentes: string;
      }>();

    // COUNT volta do Postgres como string (bigint); convertemos para number
    return linhas.map((linha) => ({
      ...linha,
      pendentes: Number(linha.pendentes),
    }));
  }
}
