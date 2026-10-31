import {
  StatusIntimacao,
  type Intimacao,
} from './entities/intimacao.entity.js';
import { extrairTrecho, paraVisao } from './intimacao.visao.js';

describe('extrairTrecho', () => {
  it('tira as tags e junta os espaços', () => {
    expect(extrairTrecho('<p>Fica   <b>intimada</b>\n a parte.</p>')).toBe(
      'Fica intimada a parte.',
    );
  });

  it('descarta o conteúdo de <script> e <style>', () => {
    expect(
      extrairTrecho('<style>p{}</style><script>alert(1)</script>Texto'),
    ).toBe('Texto');
  });

  it('decodifica as entidades que o DJEN usa', () => {
    expect(extrairTrecho('EXECU&Ccedil;&Atilde;O N&ordm; 1 &amp; &#233;')).toBe(
      'EXECUÇÃO Nº 1 & é',
    );
  });

  it('mantém entidade desconhecida como veio', () => {
    expect(extrairTrecho('a &naoexiste; b')).toBe('a &naoexiste; b');
  });

  it('corta no tamanho máximo com reticências', () => {
    expect(extrairTrecho('abcdefghij', 5)).toBe('abcde…');
  });
});

describe('paraVisao', () => {
  const base = {
    id: 1,
    djenId: '123',
    numeroProcesso: '00000010020268260000',
    numeroProcessoMascara: '0000001-00.2026.8.26.0000',
    siglaTribunal: 'TJSP',
    tipoComunicacao: 'Intimação',
    nomeOrgao: null,
    dataDisponibilizacao: '2026-10-30',
    texto: '<p>oi</p>',
    status: StatusIntimacao.PENDENTE,
    colaborador: null,
    criadaEm: new Date(),
  } satisfies Omit<Intimacao, 'link'>;

  it('só deixa passar link https', () => {
    expect(paraVisao({ ...base, link: 'https://tj.jus.br/x' }).link).toBe(
      'https://tj.jus.br/x',
    );
    expect(paraVisao({ ...base, link: 'javascript:alert(1)' }).link).toBeNull();
    expect(paraVisao({ ...base, link: 'http://inseguro' }).link).toBeNull();
  });

  it('não expõe o HTML completo nem o id do DJEN', () => {
    const visao = paraVisao({ ...base, link: null });
    expect(visao).not.toHaveProperty('texto');
    expect(visao).not.toHaveProperty('djenId');
    expect(visao.trecho).toBe('oi');
  });
});
