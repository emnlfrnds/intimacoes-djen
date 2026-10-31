// Token de injeção: interfaces somem na compilação, então o Nest precisa de um valor real
export const NOTIFIER = Symbol('NOTIFIER');

export interface Notifier {
  enviar(mensagem: string): Promise<void>;
}
