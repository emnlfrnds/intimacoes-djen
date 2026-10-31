import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DjenFiltros, DjenResposta } from './djen.types.js';

const MAX_TENTATIVAS = 3;
// Sem Retry-After esperamos 60s; e nunca mais que 2 min, para o POST não ficar pendurado
const ESPERA_PADRAO_429_MS = 60_000;
const ESPERA_MAXIMA_MS = 120_000;
const CAMINHO_MOCK = join(process.cwd(), 'mocks', 'djen.json');

export type OrigemDados = 'api' | 'mock';

export interface ResultadoBusca {
  dados: DjenResposta;
  origem: OrigemDados;
}

@Injectable()
export class DjenClient {
  private readonly logger = new Logger(DjenClient.name);

  constructor(private readonly config: ConfigService) {}

  async buscar(filtros: DjenFiltros): Promise<ResultadoBusca> {
    try {
      return { dados: await this.buscarNaApi(filtros), origem: 'api' };
    } catch (erro) {
      // Erro no NOSSO pedido (4xx) não é "API fora": o mock só esconderia o problema
      if (erro instanceof HttpException) throw erro;
      if (this.config.get<string>('DJEN_FALLBACK_MOCK', 'true') !== 'true') {
        throw erro;
      }
      this.logger.warn(`DJEN indisponível, usando o mock: ${mensagemDe(erro)}`);
      return { dados: await this.lerMock(filtros), origem: 'mock' };
    }
  }

  private async buscarNaApi(filtros: DjenFiltros): Promise<DjenResposta> {
    const url = this.montarUrl(filtros);
    const timeout = Number(this.config.get<string>('DJEN_TIMEOUT_MS', '30000'));

    for (let tentativa = 1; ; tentativa++) {
      const ultima = tentativa >= MAX_TENTATIVAS;

      let resposta: Response;
      try {
        resposta = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeout),
        });
      } catch (erro) {
        // Timeout ou falha de rede: pode ser passageiro, vale tentar de novo
        if (ultima) throw erro;
        await this.aguardar(backoff(tentativa), mensagemDe(erro));
        continue;
      }

      if (resposta.ok) {
        const dados = (await resposta.json()) as DjenResposta;
        if (!Array.isArray(dados?.items)) {
          throw new Error('Resposta do DJEN sem a lista "items"');
        }
        return dados;
      }

      if (resposta.status === 429 && !ultima) {
        const espera = lerRetryAfter(resposta.headers.get('retry-after'));
        await this.aguardar(espera, 'HTTP 429');
        continue;
      }
      if (resposta.status >= 500 && !ultima) {
        await this.aguardar(backoff(tentativa), `HTTP ${resposta.status}`);
        continue;
      }
      if (
        resposta.status >= 400 &&
        resposta.status < 500 &&
        resposta.status !== 429
      ) {
        // Repetir não adianta: o pedido está errado
        throw new BadRequestException(
          `DJEN recusou os filtros (HTTP ${resposta.status})`,
        );
      }
      throw new Error(`DJEN respondeu HTTP ${resposta.status}`);
    }
  }

  private montarUrl(filtros: DjenFiltros): string {
    const base = this.config.getOrThrow<string>('DJEN_BASE_URL');
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') params.set(chave, String(valor));
    }
    return `${base}/comunicacao?${params.toString()}`;
  }

  private async lerMock(filtros: DjenFiltros): Promise<DjenResposta> {
    const mock = JSON.parse(
      await readFile(CAMINHO_MOCK, 'utf8'),
    ) as DjenResposta;
    // O mock tem uma página só: da 2ª em diante devolve vazio para o sync parar
    const items = filtros.pagina === 1 ? mock.items : [];
    return { ...mock, count: mock.items.length, items };
  }

  // A URL não vai para o log: ela carrega o número da OAB pesquisada
  private async aguardar(ms: number, motivo: string) {
    this.logger.warn(
      `DJEN falhou (${motivo}); nova tentativa em ${Math.round(ms / 1000)}s`,
    );
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 1s, 2s, 4s...: dá tempo do servidor se recuperar sem martelar a API
function backoff(tentativa: number): number {
  return 1000 * 2 ** (tentativa - 1);
}

// Retry-After pode vir em segundos ("30") ou como data HTTP
function lerRetryAfter(valor: string | null): number {
  if (!valor) return ESPERA_PADRAO_429_MS;
  const segundos = Number(valor);
  const ms = Number.isFinite(segundos)
    ? segundos * 1000
    : Date.parse(valor) - Date.now();
  if (Number.isNaN(ms)) return ESPERA_PADRAO_429_MS;
  return Math.min(Math.max(ms, 0), ESPERA_MAXIMA_MS);
}

function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}
