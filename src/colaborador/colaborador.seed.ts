import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Colaborador } from './entities/colaborador.entity.js';

@Injectable()
export class ColaboradorSeed implements OnModuleInit {
  private readonly logger = new Logger(ColaboradorSeed.name);

  constructor(
    @InjectRepository(Colaborador)
    private readonly colaboradorRepository: Repository<Colaborador>,
  ) {}

  async onModuleInit() {
    const total = await this.colaboradorRepository.count();
    if (total > 0) {
      this.logger.log(`Seed ignorado: já existem ${total} colaboradores`);
      return;
    }

    await this.colaboradorRepository.save([
      { nome: 'Ana' },
      { nome: 'Bruno' },
      { nome: 'Guilherme' },
      { nome: 'Sousa' },
    ]);
    this.logger.log('Seed concluído: 4 colaboradores criados');
  }
}
