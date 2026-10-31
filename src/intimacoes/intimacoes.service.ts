import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DistribuicaoService } from '../distribuicao/distribuicao.service.js';
import { CreateIntimacaoDto } from './dto/create-intimacao.dto.js';
import { Intimacao, StatusIntimacao } from './entities/intimacao.entity.js';
import {
  INTIMACAO_ATRIBUIDA,
  IntimacaoAtribuidaEvent,
} from './events/intimacao-atribuida.event.js';

// Código de erro do Postgres para violação de UNIQUE
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class IntimacoesService {
  private readonly logger = new Logger(IntimacoesService.name);

  constructor(
    @InjectRepository(Intimacao)
    private readonly intimacaoRepository: Repository<Intimacao>,
    private readonly distribuicaoService: DistribuicaoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateIntimacaoDto) {
    const colaborador = await this.distribuicaoService.escolherColaborador();
    if (!colaborador) {
      this.logger.warn(
        `Nenhum colaborador ativo: processo ${dto.numeroProcesso} ficará sem atribuição`,
      );
    }

    const intimacao = await this.salvar(
      this.intimacaoRepository.create({ ...dto, colaborador }),
    );

    // Só chega aqui se o INSERT deu certo: duplicadas (409) nunca disparam alerta
    if (colaborador) {
      this.eventEmitter.emit(
        INTIMACAO_ATRIBUIDA,
        new IntimacaoAtribuidaEvent(intimacao, colaborador),
      );
    }

    return intimacao;
  }

  findAll() {
    return this.intimacaoRepository.find({
      relations: { colaborador: true },
      order: { id: 'ASC' },
    });
  }

  async concluir(id: number) {
    const intimacao = await this.intimacaoRepository.findOne({
      where: { id },
      relations: { colaborador: true },
    });
    if (!intimacao) {
      throw new NotFoundException(`Intimação ${id} não encontrada`);
    }

    intimacao.status = StatusIntimacao.CONCLUIDA;
    return this.intimacaoRepository.save(intimacao);
  }

  private async salvar(intimacao: Intimacao) {
    try {
      return await this.intimacaoRepository.save(intimacao);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Já existe uma intimação para o processo ${intimacao.numeroProcesso}`,
        );
      }
      throw error;
    }
  }
}
