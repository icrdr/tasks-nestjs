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

  @ManyToMany(() => Task, (task) => task.performers)
  tasks: Task[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @OneToMany(() => TaskLog, (taskLog) => taskLog.task)
  taskLogs: TaskLog[];

  @OneToMany(() => Comment, (comment) => comment.sender)
  comments: Comment[];

  @ManyToMany(() => Perm, (perm) => perm.users)
  @JoinTable()
  perms: Perm[];

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

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Perm, (perm) => perm.roles)
  @JoinTable()
  perms: Perm[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}

@Entity()
export class Perm extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @ManyToMany(() => Role, (role) => role.perms)
  roles: Role[];

  @ManyToMany(() => User, (user) => user.perms)
  users: User[];
}
