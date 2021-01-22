import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Task } from '@server/task/entities/task.entity';
import { BaseEntity } from '@server/common/common.entity';
import { User } from '@server/user/entities/user.entity';
import { PropertyValue } from '@server/task/entities/property.entity';

export enum SubTaskViewType {
  TABLE = 'table',
}

@Entity()
export class Asset extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.assets)
  task: Task;

  @ManyToOne(() => User, (user) => user.assets)
  creator: User;

  @OneToMany(() => PropertyValue, (propertyValue) => propertyValue.asset)
  properties: PropertyValue[];

  @Column()
  location: string;

  @Column()
  format: string;
}
