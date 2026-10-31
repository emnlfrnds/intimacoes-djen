import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DjenClient, type OrigemDados } from '../djen/djen.client.js';
import type { DjenItem } from '../djen/djen.types.js';
import { SincronizarIntimacoesDto } from './dto/sincronizar-intimacoes.dto.js';
import { Intimacao } from './entities/intimacao.entity.js';

type NovaIntimacao = Omit<Intimacao, 'id' | 'status' | 'criadaEm'>;

const NUMERO_CNJ = /^\d{20}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const ITENS_POR_PAGINA_PADRAO = 100;
const MAX_PAGINAS_PADRAO = 5;

@Injectable()
export class IntimacoesService {
  private readonly logger = new Logger(IntimacoesService.name);

  constructor(
    @InjectRepository(Intimacao)
    private readonly intimacaoRepository: Repository<Intimacao>,
    private readonly djenClient: DjenClient,
  ) {}

  async sincronizar(dto: SincronizarIntimacoesDto) {
    if (!dto.numeroOab && !dto.siglaTribunal) {
      throw new BadRequestException(
        'Informe numeroOab + ufOab ou siglaTribunal',
      );
    }
    const inicio = dto.dataDisponibilizacaoInicio ?? hojeEmBrasilia();
    const fim = dto.dataDisponibilizacaoFim ?? inicio;
    if (inicio > fim) {
      throw new BadRequestException(
        'dataDisponibilizacaoInicio deve ser <= Fim',
      );
    }
    const itensPorPagina = dto.itensPorPagina ?? ITENS_POR_PAGINA_PADRAO;
    const maxPaginas = dto.maxPaginas ?? MAX_PAGINAS_PADRAO;

    const resumo = {
      origem: 'api' as OrigemDados,
      paginas: 0,
      recebidas: 0,
      novas: 0,
      duplicadas: 0,
      invalidas: 0,
    };

    // Uma página por vez (await dentro do for): respeita o rate limit do DJEN
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const { dados, origem } = await this.djenClient.buscar({
        numeroOab: dto.numeroOab,
        ufOab: dto.ufOab,
        siglaTribunal: dto.siglaTribunal,
        dataDisponibilizacaoInicio: inicio,
        dataDisponibilizacaoFim: fim,
        pagina,
        itensPorPagina,
      });
      if (origem === 'mock') resumo.origem = 'mock';
      resumo.paginas++;
      resumo.recebidas += dados.items.length;

      const validas = dados.items.map(paraIntimacao).filter((i) => i !== null);
      resumo.invalidas += dados.items.length - validas.length;

      const inseridas = await this.inserirSemDuplicar(validas);
      resumo.novas += inseridas.length;
      resumo.duplicadas += validas.length - inseridas.length;

      // Página incompleta = acabou
      if (dados.items.length < itensPorPagina) break;
    }

    this.logger.log(`Sync concluído: ${JSON.stringify(resumo)}`);
    return resumo;
  }

  listar() {
    return this.intimacaoRepository.find({ order: { id: 'DESC' }, take: 50 });
  }

  // ON CONFLICT DO NOTHING: o UNIQUE de djenId descarta as repetidas sem erro,
  // e o RETURNING devolve só as linhas que realmente entraram
  private async inserirSemDuplicar(intimacoes: NovaIntimacao[]) {
    if (intimacoes.length === 0) return [];
    const resultado = await this.intimacaoRepository
      .createQueryBuilder()
      .insert()
      .into(Intimacao)
      .values(intimacoes)
      .orIgnore()
      .returning(['id'])
      .updateEntity(false)
      .execute();
    return resultado.raw as { id: number }[];
  }
}

// Único ponto que traduz o formato do DJEN para o nosso. Item suspeito é descartado
function paraIntimacao(item: DjenItem): NovaIntimacao | null {
  if (
    !Number.isSafeInteger(item.id) ||
    !NUMERO_CNJ.test(item.numero_processo ?? '') ||
    !DATA.test(item.data_disponibilizacao ?? '') ||
    typeof item.siglaTribunal !== 'string' ||
    item.siglaTribunal.length > 20
  ) {
    return null;
  }
  const mascara = item.numeroprocessocommascara;
  return {
    djenId: String(item.id),
    numeroProcesso: item.numero_processo,
    numeroProcessoMascara:
      mascara && mascara.length <= 25 ? mascara : item.numero_processo,
    siglaTribunal: item.siglaTribunal,
    tipoComunicacao: item.tipoComunicacao || 'Não informado',
    nomeOrgao: item.nomeOrgao ?? null,
    dataDisponibilizacao: item.data_disponibilizacao,
    texto: item.texto ?? '',
    link: item.link ?? null,
  };
}

// 'sv-SE' formata como AAAA-MM-DD; o fuso evita pegar "amanhã" depois das 21h
function hojeEmBrasilia(): string {
  return new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  });
}
