import { Module } from '@nestjs/common';
import { ColaboradorService } from './colaborador.service.js';
import { ColaboradorController } from './colaborador.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Colaborador } from './entities/colaborador.entity.js';
import { ColaboradorSeed } from './colaborador.seed.js';

@Module({
  imports: [TypeOrmModule.forFeature([Colaborador])],
  controllers: [ColaboradorController],
  providers: [ColaboradorService, ColaboradorSeed],
})
export class ColaboradorModule {}
