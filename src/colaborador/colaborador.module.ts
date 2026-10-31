import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColaboradorController } from './colaborador.controller.js';
import { ColaboradorSeed } from './colaborador.seed.js';
import { ColaboradorService } from './colaborador.service.js';
import { Colaborador } from './entities/colaborador.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Colaborador])],
  controllers: [ColaboradorController],
  providers: [ColaboradorService, ColaboradorSeed],
})
export class ColaboradorModule {}
