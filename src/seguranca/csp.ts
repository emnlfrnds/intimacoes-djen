import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// O front é um arquivo só, com <script> e <style> inline. Em vez de liberar
// 'unsafe-inline' (o que anularia a CSP contra XSS), autorizamos o hash exato
// desses blocos: qualquer script injetado tem outro hash e é bloqueado.
// Calculado no boot: depois de editar o index.html, reinicie o servidor
export function hashesInline(caminhoHtml: string) {
  const html = readFileSync(caminhoHtml, 'utf8');
  const capturar = (tag: string) =>
    [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map(
      // O navegador troca \r\n por \n antes de calcular: fazemos igual
      ([, conteudo]) => hash(conteudo.replace(/\r\n?/g, '\n')),
    );
  return { scripts: capturar('script'), estilos: capturar('style') };
}

function hash(conteudo: string): string {
  const digest = createHash('sha256').update(conteudo, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}
