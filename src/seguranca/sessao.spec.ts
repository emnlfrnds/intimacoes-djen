import {
  criarToken,
  DURACAO_SESSAO_MS,
  iguais,
  lerCookie,
  tokenValido,
} from './sessao.js';

const SEGREDO = 'a'.repeat(64);

describe('sessao', () => {
  it('aceita o token que ela mesma criou', () => {
    expect(tokenValido(criarToken(SEGREDO), SEGREDO)).toBe(true);
  });

  it('recusa token assinado com outro segredo', () => {
    expect(tokenValido(criarToken('b'.repeat(64)), SEGREDO)).toBe(false);
  });

  it('recusa token vencido', () => {
    const agora = Date.now();
    const token = criarToken(SEGREDO, agora);
    expect(tokenValido(token, SEGREDO, agora + DURACAO_SESSAO_MS + 1)).toBe(
      false,
    );
  });

  it('recusa token com a validade adulterada', () => {
    const [expiraEm, assinatura] = criarToken(SEGREDO).split('.');
    const adulterado = `${Number(expiraEm) + 1}.${assinatura}`;
    expect(tokenValido(adulterado, SEGREDO)).toBe(false);
  });

  it.each([undefined, '', 'sem-ponto', '.', '123.'])(
    'recusa token malformado: %s',
    (token) => {
      expect(tokenValido(token, SEGREDO)).toBe(false);
    },
  );

  it('compara strings de tamanhos diferentes sem lançar erro', () => {
    expect(iguais('curta', 'bem mais comprida')).toBe(false);
    expect(iguais('igual', 'igual')).toBe(true);
  });

  it('lê um cookie entre vários', () => {
    expect(lerCookie('a=1; djen_sessao=abc.def; b=2', 'djen_sessao')).toBe(
      'abc.def',
    );
    expect(lerCookie(undefined, 'djen_sessao')).toBeUndefined();
  });
});
