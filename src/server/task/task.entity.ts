import { BaseEntity } from '../common/common.entity';
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
import { Tag } from '../tag/tag.entity';
import { User } from '../user/entities/user.entity';
import { OutputData } from '@editorjs/editorjs';

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

  @Column('simple-json', { nullable: true })
  content: OutputData;

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

  @OneToMany(() => PassRequest, (passRequest) => passRequest.task)
  requests: PassRequest[];

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
export class PassRequest extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.requests)
  task: Task;

  @ManyToOne(() => User, (user) => user.passRequestsAsSubmitter)
  submitter: User;

  @ManyToOne(() => User, (user) => user.passRequestsAsResponder, {
    nullable: true,
  })
  responder: User;

  @Column({ nullable: true })
  submitContent: string;

  @Column({ nullable: true })
  responseContent: string;

  @Column({ nullable: true })
  respondAt: Date;
}
