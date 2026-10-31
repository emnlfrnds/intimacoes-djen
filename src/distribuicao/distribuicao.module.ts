import { Module } from '@nestjs/common';
import { DistribuicaoService } from './distribuicao.service.js';

// Sem forFeature: o service usa o DataSource (global) para abrir transações
@Module({
  providers: [DistribuicaoService],
  exports: [DistribuicaoService],
})
export class DistribuicaoModule {}
