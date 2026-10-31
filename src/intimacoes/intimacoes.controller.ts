import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateIntimacaoDto } from './dto/create-intimacao.dto.js';
import { IntimacoesService } from './intimacoes.service.js';

@Controller('intimacoes')
export class IntimacoesController {
  constructor(private readonly intimacoesService: IntimacoesService) {}

  @Post()
  create(@Body() dto: CreateIntimacaoDto) {
    return this.intimacoesService.create(dto);
  }

  @Get()
  findAll() {
    return this.intimacoesService.findAll();
  }

  // ParseIntPipe: "abc" vira 400 em vez de chegar como NaN no service
  @Patch(':id/concluir')
  concluir(@Param('id', ParseIntPipe) id: number) {
    return this.intimacoesService.concluir(id);
  }
}
