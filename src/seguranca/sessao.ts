import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_SESSAO = 'djen_sessao';
export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000; // um expediente

// Comparação em tempo constante: com "===", o tempo de resposta vaza quantos
// caracteres iniciais da chave estão certos. O hash iguala os tamanhos
export function iguais(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

// Token "expiraEm.assinatura": sem estado no servidor, e quem não tem a
// API key não consegue forjar nem estender a validade
export function criarToken(segredo: string, agora = Date.now()): string {
  const expiraEm = String(agora + DURACAO_SESSAO_MS);
  return `${expiraEm}.${assinar(expiraEm, segredo)}`;
}

export function tokenValido(
  token: string | undefined,
  segredo: string,
  agora = Date.now(),
): boolean {
  const [expiraEm, assinatura] = (token ?? '').split('.');
  if (!expiraEm || !assinatura || Number(expiraEm) < agora) return false;
  return iguais(assinatura, assinar(expiraEm, segredo));
}

// Leitor mínimo do header Cookie (evita instalar o cookie-parser por um campo só)
export function lerCookie(
  cabecalho: string | undefined,
  nome: string,
): string | undefined {
  for (const parte of (cabecalho ?? '').split(';')) {
    const [chave, ...valor] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(valor.join('='));
  }
  return undefined;
}

function assinar(valor: string, segredo: string): string {
  return createHmac('sha256', segredo).update(valor).digest('base64url');
}
