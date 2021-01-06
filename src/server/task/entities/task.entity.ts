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
import { TaskLog } from './taskLog.entity';
import { Comment } from './comment.entity';
import { Member } from './member.entity';
import { Header, Property } from './property.entity';
import { Asset } from '@server/asset/asset.entity';
import { View, ViewSet } from './view.entity';

export enum TaskState {
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  UNCONFIRMED = 'unconfirmed',
}

@Entity()
@Tree('closure-table')
export class Task extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TaskState,
    default: TaskState.SUSPENDED,
  })
  state: TaskState;

  @Column({ nullable: true })
  startAt: Date;

  @Column({ nullable: true })
  endAt: Date;

  @TreeParent()
  parentTask: Task;

  @TreeChildren()
  subTasks: Task[];

  @DeleteDateColumn()
  deleteAt: Date;

  @OneToMany(() => TaskContent, (taskContent) => taskContent.task)
  contents: TaskContent[];

  @OneToMany(() => TaskLog, (taskLog) => taskLog.task)
  logs: TaskLog[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => Property, (property) => property.task)
  properties: Property[];

  @OneToMany(() => Member, (member) => member.task)
  members: Member[];

  @OneToMany(() => Asset, (asset) => asset.task)
  assets: Asset[];

  @OneToOne(() => ViewSet)
  @JoinColumn()
  subTaskViewSet: ViewSet;

  @OneToOne(() => ViewSet)
  @JoinColumn() 
  assetViewSet: ViewSet;

  @OneToOne(() => ViewSet)
  @JoinColumn()
  memberViewSet: ViewSet;
}

@Entity()
export class TaskContent extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.contents)
  task: Task;

  @Column('simple-json', { nullable: true })
  content: OutputData;
}
