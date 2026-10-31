import { Controller, Get } from '@nestjs/common';
import { ColaboradorService } from './colaborador.service.js';

@Controller('colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @Get()
  findAll() {
    return this.colaboradorService.findAllComPendentes();
  }
}
