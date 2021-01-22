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
import { View, Property, PropertyValue } from './property.entity';
import { Asset } from '@server/asset/asset.entity';
import { Access, Group, Member } from './space.entity';

export enum TaskState {
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  UNCONFIRMED = 'unconfirmed',
}

@Entity()
@Tree('nested-set')
export class Task extends BaseEntity {
  @Column()
  name: string;

  @Column()
  isCompleted: boolean;

  @Column({ nullable: true })
  completeAt: Date;

  @DeleteDateColumn()
  deleteAt: Date;

  @TreeParent()
  superTask: Task;

  @TreeChildren()
  subTasks: Task[];

  @OneToMany(() => Content, (content) => content.task)
  contents: Content[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => PropertyValue, (propertyValue) => propertyValue.task)
  properties: PropertyValue[];

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

  @ManyToOne(() => Group, (group) => group.access)
  group: Group;

  @Column({
    type: 'enum',
    enum: AccessType,
  })
  access: AccessType;
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
