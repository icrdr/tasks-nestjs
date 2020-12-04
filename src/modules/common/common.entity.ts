import { Exclude, Expose } from 'class-transformer';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @CreateDateColumn()
  @Exclude()
  createAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updateAt: Date;
}
