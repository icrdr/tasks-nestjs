import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { Task } from './task.entity';
import { BaseEntity, PropertyForm, PropertyType, ViewOption, ViewType } from '@server/common/common.entity';
import { Asset } from '@server/task/entities/asset.entity';
import { Member, Space } from './space.entity';


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
  option: ViewOption;

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
