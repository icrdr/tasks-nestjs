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
import { Property, property, View } from './property.entity';
import { Task } from './task.entity';
import { Asset } from './asset.entity';

export enum LogAction {
  START = 'start',
  RESTART = 'restart',
  SUSPEND = 'suspend',
  COMPLETE = 'complete',
  COMMIT = 'commit',
  REFUSE = 'refuse',
  CREATE = 'create',
  UPDATA = 'update',
  DELETE = 'delete',
}

export enum accessLevel {
  FULL = 'full',
  EDIT = 'edit',
  VIEW = 'view',
}

@Entity()
export class Space extends BaseEntity {
  @Column()
  name: string;

  @Column()
  isPersonal: boolean;

  @OneToMany(() => Task, (task) => task.space)
  tasks: Task[];

  @OneToMany(() => Assignment, (assignment) => assignment.space)
  assignments: Assignment[];

  @OneToMany(() => Role, (role) => role.space)
  roles: Role[];

  @OneToMany(() => Member, (member) => member.space)
  members: Member[];

  @OneToMany(() => Property, (property) => property.space)
  properties: Property[];

  @DeleteDateColumn()
  deleteAt: Date;

  @OneToMany(() => View, (view) => view.space)
  views: View[];

  @OneToMany(() => Asset, (asset) => asset.space)
  assets: Asset[];

  @Column({
    type: 'enum',
    enum: accessLevel,
    nullable: true,
  })
  access: accessLevel;
}
@Entity()
export class Role extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.roles)
  space: Space;

  @OneToMany(() => Assignment, (assignment) => assignment.role)
  assignment: Assignment[];

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: accessLevel,
  })
  access: accessLevel;
}

@Entity()
export class Assignment extends BaseEntity {
  @ManyToMany(() => Task, (task) => task.assignments)
  tasks: Task[];

  @ManyToOne(() => Space, (space) => space.assignments)
  space: Space;

  @ManyToMany(() => Member)
  @JoinTable()
  members: Member[];

  @ManyToOne(() => Role, (role) => role.assignment)
  role: Role;
}

@Entity()
export class Member extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.members)
  space: Space;

  @ManyToOne(() => User, (user) => user.members)
  user: User;

  @Column('simple-json', { nullable: true })
  properties: property[];
}

// @Entity()
// export class Log extends BaseEntity {
//   @ManyToOne(() => Task, (task) => task.logs)
//   task: Task;

//   @ManyToOne(() => Space, (space) => space.logs)
//   space: Space;

//   @ManyToOne(() => User, (User) => User.logs, { nullable: true })
//   executor: User;

//   @Column({
//     type: 'enum',
//     enum: LogAction,
//   })
//   action: LogAction;
// }
