import type { Intimacao } from './entities/intimacao.entity.js';

const TAMANHO_TRECHO = 240;
const ENTIDADES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
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
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entidade) => ENTIDADES[entidade])
    .replace(/\s+/g, ' ')
    .trim();
  return texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto;
}

// O link vira href no front: "javascript:..." vindo de fora seria XSS no clique
function linkSeguro(link: string | null): string | null {
  return link?.startsWith('https://') ? link : null;
}
