import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Sobe o app de verdade: precisa do Postgres rodando (docker compose up -d)
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let apiKey: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    apiKey = app.get(ConfigService).getOrThrow<string>('API_KEY');
  });

  afterAll(async () => {
    // "?.": se o Postgres estiver fora, o beforeAll falha e app fica undefined
    await app?.close();
  });

  it('recusa requisição sem credencial', () => {
    return request(app.getHttpServer()).get('/colaboradores').expect(401);
  });

  it('aceita a API key no header', () => {
    return request(app.getHttpServer())
      .get('/colaboradores')
      .set('x-api-key', apiKey)
      .expect(200);
  });

  it('troca a API key por um cookie HttpOnly e aceita o cookie', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/sessao')
      .set('x-api-key', apiKey)
      .expect(204);

    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);

    await request(app.getHttpServer())
      .get('/colaboradores')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
  });

  it('valida o corpo do sync antes de chamar o DJEN', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/intimacoes/sync')
      .set('x-api-key', apiKey)
      .send({ siglaTribunal: 'tj-sp!', campoQueNaoExiste: 1 })
      .expect(400);

    expect(resposta.body.message).toEqual(
      expect.arrayContaining(['property campoQueNaoExiste should not exist']),
    );
  });
});
