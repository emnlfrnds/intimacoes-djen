// Uso: node scripts/anonimizar-mocks.mjs  (sobrescreve mocks/djen.json)
import { readFileSync, writeFileSync } from 'node:fs';

const ARQUIVO = 'mocks/djen.json';
const dados = JSON.parse(readFileSync(ARQUIVO, 'utf8'));

dados.items = dados.items.map((item, i) => {
  const n = i + 1;
  const id = 900000 + n;
  const seq = String(n).padStart(7, '0');
  return {
    ...item,
    id,
    hash: `mock-hash-${n}`,
    numeroComunicacao: n,
    // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (8.26 = TJSP, igual ao siglaTribunal)
    numero_processo: `${seq}0020268260000`,
    numeroprocessocommascara: `${seq}-00.2026.8.26.0000`,
    link: 'https://exemplo.invalid/processo',
    texto: `<html><body><p>Intimação fictícia nº ${n} destinada a <b>PARTE ${n}</b>.</p></body></html>`,
    destinatarios: (item.destinatarios ?? []).map((d, j) => ({
      ...d,
      comunicacao_id: id,
      nome: `PARTE ${n}-${j + 1}`,
    })),
    destinatarioadvogados: (item.destinatarioadvogados ?? []).map((a, j) => ({
      ...a,
      id: 700000 + n * 10 + j,
      comunicacao_id: id,
      advogado_id: 800000 + j,
      advogado: { id: 800000 + j, nome: `ADVOGADO(A) ${j + 1}`, numero_oab: String(100000 + j), uf_oab: 'SP' },
    })),
  };
});

// De propósito: um payload de XSS para provar na demo que o front usa textContent
dados.items[0].texto = dados.items[0].texto.replace('</p>', '</p><img src=x onerror="alert(\'XSS\')">');

writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + '\n');
console.log(`${dados.items.length} itens anonimizados em ${ARQUIVO}`);