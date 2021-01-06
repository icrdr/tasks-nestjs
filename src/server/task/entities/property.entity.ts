import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { Task } from './task.entity';
import { BaseEntity } from '@server/common/common.entity';
import { Member } from './member.entity';
import { Asset } from '@server/asset/asset.entity';
import { ViewSet } from './view.entity';

export enum PropertyType {
  NUMBER = 'number',
  STRING = 'string',
  FORMULA = 'formula',
}

@Entity()
export class Property extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.properties)
  task: Task;

  @ManyToOne(() => Member, (member) => member.properties)
  member: Member;

  @ManyToOne(() => Asset, (asset) => asset.properties)
  asset: Asset;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  type: PropertyType;

  @Column('simple-json')
  value: any;
}

@Entity()
export class Header extends BaseEntity {
  @ManyToOne(() => ViewSet, (viewSet) => viewSet.views)
  viewSet: ViewSet;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  type: PropertyType;

  @Column('simple-json')
  items: any;
}
