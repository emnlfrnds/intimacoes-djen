import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Colaborador } from '../../colaborador/entities/colaborador.entity.js';

export enum StatusIntimacao {
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
}

// A distribuição conta "pendentes por colaborador" a cada atribuição: este índice serve essa contagem
@Index(['colaborador', 'status'])
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

  // type explícito: com "string | null" o TS emite "Object" e o TypeORM não sabe o tipo
  @Column({ type: 'varchar', nullable: true })
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

  // null enquanto não há colaborador ativo para receber
  @ManyToOne(() => Colaborador, (colaborador) => colaborador.intimacoes, {
    nullable: true,
  })
  colaborador: Relation<Colaborador> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  criadaEm: Date;
}
