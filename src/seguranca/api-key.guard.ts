import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { COOKIE_SESSAO, iguais, lerCookie, tokenValido } from './sessao.js';

const PUBLICO = 'rota-publica';
// Marca uma rota que não exige autenticação (o padrão é exigir: fechado por padrão)
export const Publico = () => SetMetadata(PUBLICO, true);

// Aceita duas credenciais: header x-api-key (scripts, curl, Postman) ou o
// cookie de sessão (navegador, inclusive o EventSource do SSE)
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    const publico = this.reflector.getAllAndOverride<boolean>(PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (publico) return true;

    const req = contexto.switchToHttp().getRequest<Request>();
    const apiKey = this.config.getOrThrow<string>('API_KEY');

    const enviada = req.header('x-api-key');
    if (enviada && iguais(enviada, apiKey)) return true;
    if (tokenValido(lerCookie(req.headers.cookie, COOKIE_SESSAO), apiKey)) {
      return true;
    }
    throw new UnauthorizedException('Credencial ausente ou inválida');
  }
}
