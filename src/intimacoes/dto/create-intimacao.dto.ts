import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIntimacaoDto {
  @IsString()
  @IsNotEmpty()
  numeroProcesso: string;

  @IsString()
  @IsNotEmpty()
  conteudo: string;
}
