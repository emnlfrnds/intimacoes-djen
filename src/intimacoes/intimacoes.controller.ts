import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SincronizarIntimacoesDto } from './dto/sincronizar-intimacoes.dto.js';
import { IntimacoesService } from './intimacoes.service.js';

@Controller('intimacoes')
export class IntimacoesController {
  constructor(private readonly intimacoesService: IntimacoesService) {}

  // 200 e não 201: o sync pode terminar sem criar nada (tudo duplicado).
  // Limite próprio: cada chamada aqui gera várias chamadas ao DJEN
  @Post('sync')
  @HttpCode(200)
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  sincronizar(@Body() dto: SincronizarIntimacoesDto) {
    return this.intimacoesService.sincronizar(dto);
  }

  @Post('distribuir-pendentes')
  @HttpCode(200)
  distribuirPendentes() {
    return this.intimacoesService.distribuirPendentes();
  }

  @Get()
  listar() {
    return this.intimacoesService.listar();
  }

  // ParseIntPipe: "abc" vira 400 em vez de chegar como NaN no service
  @Patch(':id/concluir')
  concluir(@Param('id', ParseIntPipe) id: number) {
    return this.intimacoesService.concluir(id);
  }
}
