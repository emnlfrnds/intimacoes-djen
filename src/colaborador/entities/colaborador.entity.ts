import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Intimacao } from '../../intimacoes/entities/intimacao.entity.js';

@Entity('colaboradores')
export class Colaborador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Intimacao, (intimacao) => intimacao.colaborador)
  intimacoes: Relation<Intimacao>[];
}
