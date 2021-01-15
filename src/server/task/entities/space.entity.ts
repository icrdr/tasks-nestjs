import { BaseEntity } from '@server/common/common.entity';
import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  TreeParent,
  TreeChildren,
  Tree,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { OutputData } from '@editorjs/editorjs';
import { Comment } from './comment.entity';
import { View, Property, PropertyType } from './property.entity';
import { Asset } from '@server/asset/asset.entity';
import { Access, Task } from './task.entity';

@Entity()
export class Space extends BaseEntity {
  @Column()
  name: string;

  @OneToMany(() => Role, (role) => role.space)
  roles: Role[];

  @OneToMany(() => PropertyType, (propertyType) => propertyType.space)
  properties: PropertyType[];

  @OneToMany(() => View, (view) => view.task)
  views: View[];

  @OneToMany(() => Group, (task) => task.space)
  groups: Group[];

  @OneToMany(() => Member, (member) => member.space)
  members: Member[];

  @OneToMany(() => Task, (task) => task.space)
  tasks: Task[];
}

@Entity()
export class Group extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.groups)
  space: Space;

  @Column()
  name: string;

  @OneToMany(() => Access, (access) => access.group)
  access: Access[];

  @OneToMany(() => Member, (member) => member.space)
  members: Member[];
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
export class Member extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.members)
  space: Space;

  @ManyToOne(() => User, (user) => user.members)
  user: User;

  @OneToMany(() => Property, (property) => property.member)
  properties: Property[];
}
