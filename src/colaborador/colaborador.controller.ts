import { Controller, Get } from '@nestjs/common';
import { ColaboradorService } from './colaborador.service.js';

@Controller('colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @Get()
  listar() {
    return this.colaboradorService.listarComFila();
  }
}
