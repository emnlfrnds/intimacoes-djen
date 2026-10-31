import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Intimacao } from './entities/intimacao.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Intimacao])],
})
export class IntimacoesModule {}
