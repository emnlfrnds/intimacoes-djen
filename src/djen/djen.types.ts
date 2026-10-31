// Formato EXTERNO, espelhando o JSON do DJEN (mistura snake_case e camelCase).
// É uma promessa, não garantia: o mapeamento no IntimacoesService valida os campos críticos.
export interface DjenItem {
  id: number;
  data_disponibilizacao: string; // '2026-10-30'
  siglaTribunal: string;
  tipoComunicacao: string | null;
  nomeOrgao: string | null;
  texto: string | null; // HTML cru
  numero_processo: string; // 20 dígitos
  numeroprocessocommascara: string | null;
  link: string | null;
}

export interface DjenResposta {
  status: string;
  message: string;
  count: number;
  items: DjenItem[];
}

// Filtros aceitos pela API (os nomes são os mesmos da query string)
export interface DjenFiltros {
  numeroOab?: string;
  ufOab?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina: number;
  itensPorPagina: number;
}
