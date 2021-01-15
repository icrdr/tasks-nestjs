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
import { Task, Log } from '@server/task/entities/task.entity';
import { Comment } from '@server/task/entities/comment.entity';
import { Asset } from '@server/asset/asset.entity';
import { Member } from '@server/task/entities/space.entity';

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
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

  @OneToMany(() => Member, (member) => member.user)
  members: Member[];

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.USER,
  })
  role: string;

  @OneToMany(() => Log, (log) => log.executor)
  logs: Log[];

  @OneToMany(() => Comment, (comment) => comment.sender)
  comments: Comment[];

  @OneToMany(() => Asset, (asset) => asset.creator)
  assets: Asset[];

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
