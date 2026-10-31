import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Colaborador } from '../colaborador/entities/colaborador.entity.js';
import { DistribuicaoService } from './distribuicao.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Colaborador])],
  providers: [DistribuicaoService],
  exports: [DistribuicaoService],
})
export class DistribuicaoModule {}
