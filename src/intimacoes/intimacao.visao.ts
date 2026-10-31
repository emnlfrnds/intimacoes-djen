import type { Intimacao } from './entities/intimacao.entity.js';

const TAMANHO_TRECHO = 240;
const NOMEADAS: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ordm: 'º',
  ordf: 'ª',
  sect: '§',
  deg: '°',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  middot: '·',
};
// &Ccedil; = "C" + cedilha combinante; o normalize('NFC') junta em "Ç"
const ACENTOS: Record<string, string> = {
  acute: '́',
  grave: '̀',
  circ: '̂',
  tilde: '̃',
  uml: '̈',
  cedil: '̧',
};

// O que sai da API para o front (listagem e SSE): nunca a entidade crua
export function paraVisao(intimacao: Intimacao) {
  return {
    id: intimacao.id,
    numeroProcessoMascara: intimacao.numeroProcessoMascara,
    siglaTribunal: intimacao.siglaTribunal,
    tipoComunicacao: intimacao.tipoComunicacao,
    nomeOrgao: intimacao.nomeOrgao,
    dataDisponibilizacao: intimacao.dataDisponibilizacao,
    status: intimacao.status,
    trecho: extrairTrecho(intimacao.texto),
    link: linkSeguro(intimacao.link),
    colaborador: intimacao.colaborador
      ? { id: intimacao.colaborador.id, nome: intimacao.colaborador.nome }
      : null,
    criadaEm: intimacao.criadaEm,
  };
}

export type IntimacaoVisao = ReturnType<typeof paraVisao>;

// Resumo em texto puro. NÃO é sanitização: a proteção contra XSS é o
// textContent no front. Isto só tira as tags para caber num card.
export function extrairTrecho(html: string, max = TAMANHO_TRECHO): string {
  const texto = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  const limpo = decodificarEntidades(texto).replace(/\s+/g, ' ').trim();
  return limpo.length > max ? `${limpo.slice(0, max).trimEnd()}…` : limpo;
}

// O DJEN escreve "EXECU&Ccedil;&Atilde;O": decodifica numéricas, as nomeadas
// mais comuns e as letras acentuadas. Desconhecida fica como veio
function decodificarEntidades(texto: string): string {
  return texto.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (original, nome: string) => {
      if (nome.startsWith('#')) {
        const hex = nome[1] === 'x' || nome[1] === 'X';
        const codigo = parseInt(nome.slice(hex ? 2 : 1), hex ? 16 : 10);
        return codigo > 0 && codigo <= 0x10ffff
          ? String.fromCodePoint(codigo)
          : original;
      }
      if (NOMEADAS[nome]) return NOMEADAS[nome];
      const acento = /^([A-Za-z])(acute|grave|circ|tilde|uml|cedil)$/.exec(
        nome,
      );
      return acento
        ? (acento[1] + ACENTOS[acento[2]]).normalize('NFC')
        : original;
    },
  );
}

// O link vira href no front: "javascript:..." vindo de fora seria XSS no clique
function linkSeguro(link: string | null): string | null {
  return link?.startsWith('https://') ? link : null;
}
