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
import { property } from './property.entity';
import { Asset } from '@server/task/entities/asset.entity';
import { AccessLevel, Assignment, Space } from './space.entity';

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

  @Column({
    type: 'enum',
    enum: TaskState,
  })
  state: TaskState;

  @Column({ nullable: true })
  beginAt: Date;

  @Column({ nullable: true })
  dueAt: Date;

  @Column({ nullable: true })
  completeAt: Date;

  @DeleteDateColumn()
  deleteAt: Date;

  @TreeParent()
  superTask: Task;

  @TreeChildren()
  subTasks: Task[];

  @ManyToOne(() => Space, (space) => space.tasks)
  space: Space;

  @OneToMany(() => Content, (content) => content.task)
  contents: Content[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @Column('simple-json', { nullable: true })
  properties: any;

  @ManyToMany(() => Assignment, (assignment) => assignment.tasks)
  @JoinTable()
  assignments: Assignment[];

  @OneToMany(() => Asset, (asset) => asset.task)
  assets: Asset[];

  @Column({
    type: 'enum',
    enum: AccessLevel,
    nullable: true,
  })
  access: AccessLevel;
}

@Entity()
export class Content extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.contents)
  task: Task;

  @Column('simple-json', { nullable: true })
  content: OutputData;
}
