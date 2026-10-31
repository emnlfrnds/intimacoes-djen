import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum StatusIntimacao {
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
}

@Entity('intimacoes')
export class Intimacao {
  @PrimaryGeneratedColumn()
  id: number;

  // id do item no DJEN: é ele que garante "sem duplicar", não o número do processo
  @Column({ type: 'bigint', unique: true })
  djenId: string;

  @Column({ length: 20 })
  numeroProcesso: string;

  @Column({ length: 25 })
  numeroProcessoMascara: string;

  @Column({ length: 20 })
  siglaTribunal: string;

  @Column()
  tipoComunicacao: string;

  @Column({ nullable: true })
  nomeOrgao: string | null;

  @Column({ type: 'date' })
  dataDisponibilizacao: string;

  // HTML cru vindo do DJEN: o front NUNCA deve usar innerHTML com isso
  @Column({ type: 'text' })
  texto: string;

  @Column({ type: 'text', nullable: true })
  link: string | null;

  @Column({
    type: 'enum',
    enum: StatusIntimacao,
    default: StatusIntimacao.PENDENTE,
  })
  status: StatusIntimacao;

  @CreateDateColumn({ type: 'timestamptz' })
  criadaEm: Date;
}
