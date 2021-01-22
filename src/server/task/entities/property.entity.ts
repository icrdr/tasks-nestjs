import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { Task } from './task.entity';
import { BaseEntity } from '@server/common/common.entity';
import { Asset } from '@server/asset/asset.entity';
import { Member } from './space.entity';

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
  CARD = 'card',
}

export enum ViewType {
  MEMBER = 'member',
  TASK = 'task',
  ASSET = 'asset',
}

@Entity()
export class View extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.views)
  task: Task;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ViewType,
  })
  type: ViewType;

  @Column({
    type: 'enum',
    enum: ViewForm,
  })
  form: ViewForm;

  @OneToMany(() => Property, (property) => property.view)
  properties: Property[];

  @Column('simple-json', { nullable: true })
  sorts: any;

  @Column('simple-json', { nullable: true })
  filters: any;

  @Column('simple-json', { nullable: true })
  options: any;
}

@Entity()
export class Property extends BaseEntity {
  @ManyToOne(() => View, (view) => view.properties)
  view: View;

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
  items: any[];
}

@Entity()
export class PropertyValue extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.properties)
  task: Task;

  @ManyToOne(() => Member, (member) => member.properties)
  member: Member;

  @ManyToOne(() => Asset, (asset) => asset.properties)
  asset: Asset;

  @ManyToOne(() => Property, (property) => property)
  property: Property;

  @Column('simple-json')
  value: any;
}
