import { BaseEntity } from '@server/common/common.entity';
import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { PropertyValue } from './property.entity';
import { Task } from './task.entity';

export enum AccessType {
  FULL = 'full',
  EDIT = 'edit',
  VIEW = 'view',
}

@Entity()
export class Space extends BaseEntity {
  @Column()
  name: string;

  @OneToMany(() => Role, (role) => role.space)
  roles: Role[];

  @OneToMany(() => Group, (group) => group.space)
  tasks: Task[];

  @OneToMany(() => Group, (group) => group.space)
  groups: Group[];

  @OneToMany(() => Member, (member) => member.space)
  members: Member[];

  @DeleteDateColumn()
  deleteAt: Date;
}

@Entity()
export class Role extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.groups)
  space: Space;

  @Column()
  name: string;

  @Column('simple-json', { nullable: true })
  access: string[];
}

@Entity()
export class Group extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.groups)
  space: Space;

  @Column()
  name: string;

  @ManyToMany(() => Member)
  @JoinTable()
  members: Member[];

  @OneToMany(() => Access, (access) => access.group)
  access: Access[];
}

@Entity()
export class Member extends BaseEntity {
  @ManyToOne(() => Task, (group) => group.members)
  task: Task;

  @ManyToOne(() => User, (user) => user.members)
  user: User;

  @OneToMany(() => PropertyValue, (propertyValue) => propertyValue.member)
  properties: PropertyValue[];
}


