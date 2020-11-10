import { BaseEntity } from '../common/common.entity';
import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Tag } from '../tag/tag.entity';
import { User } from '../user/entities/user.entity';

export enum TaskState {
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  UNCONFIRMED = 'unconfirmed',
}

@Entity()
export class Task extends BaseEntity {
  @Column()
  name: string;

  @Column()
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

  @OneToMany(() => PassRequest, (passRequest) => passRequest.task)
  requests: PassRequest[];

  @ManyToMany(() => Tag, (tag) => tag.tasks)
  @JoinTable()
  tags: Tag[];

  @DeleteDateColumn()
  @Exclude()
  deleteAt: Date;
}

@Entity()
export class PassRequest extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.requests)
  task: string;

  @ManyToOne(() => User, (user) => user.passRequestsAsSubmitter)
  submitter: User;

  @ManyToOne(() => User, (user) => user.passRequestsAsResponder, {
    nullable: true,
  })
  responder: User;

  @Column()
  submitContent: string;

  @Column({ nullable: true })
  responseContent: string;

  @Column({ nullable: true })
  respondAt: Date;
}
