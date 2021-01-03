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
} from 'typeorm';
import { Tag } from '@server/tag/tag.entity';
import { User } from '@server/user/entities/user.entity';
import { OutputData } from '@editorjs/editorjs';
import { TaskLog } from './taskLog.entity';
import { Comment } from './comment.entity';
import { TaskParticipant } from './taskParticipant.entity';
import { Property } from './property.entity';

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

  @OneToMany(() => TaskParticipant, taskParticipant => taskParticipant.task)
  taskParticipants: TaskParticipant[];

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

  @OneToMany(() => Property, (Property) => Property.task)
  properties: Property[];

  @OneToMany(() => TaskView, (TaskView) => TaskView.task)
  views: TaskView[];

  @OneToMany(() => TaskContent, (taskContent) => taskContent.task)
  contents: TaskContent[];

  @OneToMany(() => TaskLog, (taskLog) => taskLog.task)
  logs: TaskLog[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @TreeParent()
  parentTask: Task;

  @TreeChildren()
  subTasks: Task[];

  @DeleteDateColumn()
  deleteAt: Date;
}

@Entity()
export class TaskContent extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.contents)
  task: Task;

  @Column('simple-json', { nullable: true })
  content: OutputData;
}

export enum TaskViewType {
  PAGE = 'page',
  TABLE = 'table',
  FOLDER = 'folder'
}

@Entity()
export class TaskView extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.views)
  task: Task;

  @Column('simple-json', { nullable: true })
  options: any;

  @Column({
    type: 'enum',
    enum: TaskViewType,
  })
  type: TaskViewType;
}
