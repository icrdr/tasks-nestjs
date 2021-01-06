import { BaseEntity } from '@server/common/common.entity';
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { Task } from './task.entity';
import { Property } from './property.entity';

@Entity()
export class Member extends BaseEntity {
  @OneToMany(() => Property, (property) => property.member)
  properties: Property[];

  @Column('simple-json', { nullable: true })
  access: string[];

  @ManyToOne(() => Task, (task) => task.members)
  task: Task;

  @ManyToOne(() => User, (user) => user.members)
  user: User;
}
