import { BaseEntity } from '@server/common/common.entity';
import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  DeleteDateColumn,
  OneToMany,
  Connection,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Task } from '@server/task/entities/task.entity';
import { Comment } from '@server/task/entities/comment.entity';
import { TaskLog } from '@server/task/entities/taskLog.entity';
import { TaskParticipant } from '@server/task/entities/taskParticipant.entity';

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({
    type: 'enum',
    enum: UserGender,
    nullable: true,
  })
  gender: UserGender;

  @Column({ nullable: true })
  idNumber: string;

  @OneToMany(() => TaskParticipant, taskParticipant => taskParticipant.participant)
  taskParticipants: TaskParticipant[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @OneToMany(() => TaskLog, (taskLog) => taskLog.executor)
  taskLogs: TaskLog[];

  @OneToMany(() => Comment, (comment) => comment.sender)
  comments: Comment[];

  @DeleteDateColumn()
  @Exclude()
  deleteAt: Date;
}

export enum ThirdAuthType {
  WECHAT = 'wechat',
}

@Entity()
export class ThirdAuth extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ThirdAuthType,
  })
  type: string;

  @Column()
  uid: string;
}

@Entity()
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column('simple-json', { nullable: true })
  permissions: string[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}