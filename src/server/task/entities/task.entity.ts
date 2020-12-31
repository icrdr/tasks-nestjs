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

  @Column({ default: false })
  isMandatory: boolean;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.tasks)
  @JoinTable()
  performers: User[];

  @Column({ nullable: true })
  startAt: Date;

  @Column({ nullable: true })
  endAt: Date;

  @Column({
    type: 'enum',
    enum: TaskState,
    default: TaskState.SUSPENDED,
  })
  state: TaskState;

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

  @ManyToMany(() => Tag, (tag) => tag.tasks)
  @JoinTable()
  tags: Tag[];

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