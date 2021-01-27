import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Task } from '@server/task/entities/task.entity';
import { BaseEntity } from '@server/common/common.entity';
import { User } from '@server/user/entities/user.entity';
import { property } from './property.entity';
import { Space } from './space.entity';

@Entity()
export class Asset extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Space, (space) => space.assets)
  space: Space;

  @ManyToOne(() => Task, (task) => task.assets)
  task: Task;

  @ManyToOne(() => User, (user) => user.assets)
  uploader: User;

  @Column('simple-json', { nullable: true })
  properties: property[];

  @Column()
  location: string;

  @Column()
  format: string;
}
