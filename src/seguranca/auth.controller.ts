import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Publico } from './api-key.guard.js';
import {
  COOKIE_SESSAO,
  criarToken,
  DURACAO_SESSAO_MS,
  iguais,
} from './sessao.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  // Troca a API key por um cookie HttpOnly. Motivo: o EventSource do navegador
  // NÃO deixa enviar header (nem Authorization, nem x-api-key), mas envia
  // cookies do mesmo site automaticamente
  @Publico()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // freia força bruta na chave
  @Post('sessao')
  @HttpCode(204)
  criarSessao(
    @Headers('x-api-key') enviada: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const apiKey = this.config.getOrThrow<string>('API_KEY');
    if (!enviada || !iguais(enviada, apiKey)) {
      throw new UnauthorizedException('API key inválida');
    }
    res.cookie(COOKIE_SESSAO, criarToken(apiKey), {
      httpOnly: true, // JavaScript da página não lê: um XSS não rouba a sessão
      sameSite: 'strict', // outro site não consegue usar o cookie (CSRF)
      secure: this.config.get<string>('NODE_ENV') === 'production',
      maxAge: DURACAO_SESSAO_MS,
      path: '/',
    });
  }

  @Publico()
  @Post('sair')
  @HttpCode(204)
  sair(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_SESSAO, { path: '/' });
  }
}
