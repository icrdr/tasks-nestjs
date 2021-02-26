import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { Task } from './task.entity';
import { BaseEntity } from '@server/common/common.entity';
import { Asset } from '@server/task/entities/asset.entity';
import { Member, Space } from './space.entity';

export enum PropertyType {
  MEMBER = 'member',
  TASK = 'task',
  ASSET = 'asset',
}

export enum PropertyForm {
  NUMBER = 'number',
  STRING = 'string',
}

export enum ViewForm {
  TABLE = 'table',
  LIST = 'list',
  CARD = 'gallery',
}

export enum ViewType {
  MEMBER = 'member',
  TASK = 'task',
  ASSET = 'asset',
}

export interface viewOption {
  form: ViewForm;
  sorts: any;
  filters: any;
  properties: number[];
  options: any;
}

@Entity()
export class View extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ViewType,
  })
  type: ViewType;

  @Column('simple-json', { nullable: true })
  options: viewOption;

  @ManyToOne(() => Space, (space) => space.views)
  space: Space;
}

@Entity()
export class Property extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.properties)
  space: Space;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  type: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyForm,
  })
  form: PropertyForm;

  @Column('simple-json')
  items: string[];
}

export interface property {
  id: number;
  value: any;
}
