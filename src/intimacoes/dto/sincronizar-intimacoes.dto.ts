import {
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export class SincronizarIntimacoesDto {
  @IsOptional()
  @Matches(/^\d{1,8}$/, { message: 'numeroOab deve ter só dígitos (até 8)' })
  numeroOab?: string;

  // Obrigatória junto com numeroOab: a OAB só identifica alguém com a UF
  @ValidateIf(
    (dto: SincronizarIntimacoesDto) =>
      dto.numeroOab !== undefined || dto.ufOab !== undefined,
  )
  @Matches(/^[A-Z]{2}$/, { message: 'ufOab deve ser a sigla da UF, ex: SP' })
  ufOab?: string;

  @IsOptional()
  @Matches(/^[A-Z0-9]{2,10}$/, { message: 'siglaTribunal inválida, ex: TJSP' })
  siglaTribunal?: string;

  // Matches garante o formato curto; IsISO8601 strict recusa datas como 2026-02-30
  @IsOptional()
  @Matches(DATA, { message: 'use o formato AAAA-MM-DD' })
  @IsISO8601({ strict: true })
  dataDisponibilizacaoInicio?: string;

  @IsOptional()
  @Matches(DATA, { message: 'use o formato AAAA-MM-DD' })
  @IsISO8601({ strict: true })
  dataDisponibilizacaoFim?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  itensPorPagina?: number;

  // Teto de páginas por sync: um dia inteiro do TJSP tem 10.000+ comunicações
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxPaginas?: number;
}
