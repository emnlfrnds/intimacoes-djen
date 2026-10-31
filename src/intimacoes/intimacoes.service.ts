import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DistribuicaoService } from '../distribuicao/distribuicao.service.js';
import { DjenClient, type OrigemDados } from '../djen/djen.client.js';
import type { DjenItem } from '../djen/djen.types.js';
import { SincronizarIntimacoesDto } from './dto/sincronizar-intimacoes.dto.js';
import { Intimacao, StatusIntimacao } from './entities/intimacao.entity.js';
import { paraVisao } from './intimacao.visao.js';

type NovaIntimacao = Omit<
  Intimacao,
  'id' | 'status' | 'criadaEm' | 'colaborador'
>;

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
    private readonly distribuicaoService: DistribuicaoService,
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
      atribuidas: 0,
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
      resumo.atribuidas += await this.distribuirEmSequencia(
        inseridas.map(({ id }) => id),
      );

      // Página incompleta = acabou
      if (dados.items.length < itensPorPagina) break;
    }

    this.logger.log(`Sync concluído: ${JSON.stringify(resumo)}`);
    return resumo;
  }

  async listar() {
    const intimacoes = await this.intimacaoRepository.find({
      relations: { colaborador: true },
      order: { id: 'DESC' },
      take: 50,
    });
    return intimacoes.map(paraVisao);
  }

  // Reprocessa as que ficaram sem dono (ex.: sync rodou sem colaborador ativo)
  async distribuirPendentes() {
    const semDono = await this.intimacaoRepository.find({
      select: { id: true },
      where: { colaborador: IsNull(), status: StatusIntimacao.PENDENTE },
      order: { id: 'ASC' },
    });
    const atribuidas = await this.distribuirEmSequencia(
      semDono.map(({ id }) => id),
    );
    return { encontradas: semDono.length, atribuidas };
  }

  async concluir(id: number) {
    const intimacao = await this.intimacaoRepository.findOne({
      where: { id },
      relations: { colaborador: true },
    });
    if (!intimacao) {
      throw new NotFoundException(`Intimação ${id} não encontrada`);
    }
    intimacao.status = StatusIntimacao.CONCLUIDA;
    return paraVisao(await this.intimacaoRepository.save(intimacao));
  }

  // for...of com await, e NÃO Promise.all: cada escolha depende da fila que a
  // anterior acabou de gravar. Em paralelo, todas as transações disputariam a
  // mesma trava (ordem imprevisível) e prenderiam várias conexões do pool à toa.
  private async distribuirEmSequencia(ids: number[]) {
    let atribuidas = 0;
    for (const id of ids) {
      try {
        if (await this.distribuicaoService.distribuir(id)) atribuidas++;
      } catch (erro) {
        // Uma falha não derruba o lote: a intimação fica sem dono e pode ser
        // reprocessada em POST /intimacoes/distribuir-pendentes
        this.logger.error(
          `Falha ao distribuir a intimação ${id}`,
          erro instanceof Error ? erro.stack : String(erro),
        );
      }
    }
    return atribuidas;
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
