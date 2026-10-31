import { Module } from '@nestjs/common';
import { IntimacoesService } from './intimacoes.service.js';
import { IntimacoesController } from './intimacoes.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intimacao } from './entities/intimacao.entity.js';
import { DistribuicaoModule } from '../distribuicao/distribuicao.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Intimacao]), DistribuicaoModule],
  controllers: [IntimacoesController],
  providers: [IntimacoesService],
})
export class IntimacoesModule {}
