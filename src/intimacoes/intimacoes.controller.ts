import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { SincronizarIntimacoesDto } from './dto/sincronizar-intimacoes.dto.js';
import { IntimacoesService } from './intimacoes.service.js';

@Controller('intimacoes')
export class IntimacoesController {
  constructor(private readonly intimacoesService: IntimacoesService) {}

  // 200 e não 201: o sync pode terminar sem criar nada (tudo duplicado)
  @Post('sync')
  @HttpCode(200)
  sincronizar(@Body() dto: SincronizarIntimacoesDto) {
    return this.intimacoesService.sincronizar(dto);
  }

  @Get()
  listar() {
    return this.intimacoesService.listar();
  }
}
