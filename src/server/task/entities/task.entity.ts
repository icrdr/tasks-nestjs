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
import { View, Property } from './property.entity';
import { Asset } from '@server/asset/asset.entity';
import { Group, Role, Space } from './space.entity';

export enum TaskState {
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  UNCONFIRMED = 'unconfirmed',
}

@Entity()
@Tree('nested-set')
export class Task extends BaseEntity {
  @ManyToOne(() => Space, (space) => space.tasks)
  space: Space;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TaskState,
    default: TaskState.IN_PROGRESS,
  })
  state: TaskState;

  @Column({ nullable: true })
  startAt: Date;

  @Column({ nullable: true })
  dueAt: Date;

  @Column({ nullable: true })
  endAt: Date;

  @TreeParent()
  superTask: Task;

  @TreeChildren()
  subTasks: Task[];

  @DeleteDateColumn()
  deleteAt: Date;

  @OneToMany(() => Content, (content) => content.task)
  contents: Content[];

  @OneToMany(() => Log, (log) => log.task)
  logs: Log[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => Property, (property) => property.task)
  properties: Property[];

  @OneToMany(() => Access, (access) => access.task)
  access: Access[];

  @OneToMany(() => Asset, (asset) => asset.task)
  assets: Asset[];

  @OneToMany(() => View, (view) => view.task)
  views: View[];
}

@Entity()
export class Access extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.access)
  task: Task;

  @ManyToOne(() => Role, (role) => role.access)
  role: Role;

  @ManyToOne(() => Group, (group) => group.access)
  group: Group;
}

@Entity()
export class Content extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.contents)
  task: Task;

  @Column('simple-json', { nullable: true })
  content: OutputData;
}

export enum ActionType {
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

@Entity()
export class Log extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.logs)
  task: Task;

  @ManyToOne(() => User, (User) => User.logs, { nullable: true })
  executor: User;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action: ActionType;
}
