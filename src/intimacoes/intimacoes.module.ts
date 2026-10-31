import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistribuicaoModule } from '../distribuicao/distribuicao.module.js';
import { DjenModule } from '../djen/djen.module.js';
import { Intimacao } from './entities/intimacao.entity.js';
import { IntimacoesController } from './intimacoes.controller.js';
import { IntimacoesService } from './intimacoes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Intimacao]),
    DjenModule,
    DistribuicaoModule,
  ],
  controllers: [IntimacoesController],
  providers: [IntimacoesService],
})
export class IntimacoesModule {}
