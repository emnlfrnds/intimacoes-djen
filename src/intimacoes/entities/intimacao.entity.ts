import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Colaborador } from '../../colaborador/entities/colaborador.entity.js';

export enum StatusIntimacao {
  PENDENTE = 'PENDENTE',
  CONCLUIDA = 'CONCLUIDA',
}

@Entity('intimacoes')
export class Intimacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numeroProcesso: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({
    type: 'enum',
    enum: StatusIntimacao,
    default: StatusIntimacao.PENDENTE,
  })
  status: StatusIntimacao;

  @ManyToOne(() => Colaborador, (colaborador) => colaborador.intimacoes, {
    nullable: true,
  })
  colaborador: Relation<Colaborador> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  criadaEm: Date;
}
