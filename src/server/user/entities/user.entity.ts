import { BaseEntity, RoleType, ThirdAuthType } from '@server/common/common.entity';
import { Entity, Column, JoinTable, ManyToMany, DeleteDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Comment } from '@server/task/entities/comment.entity';
import { Asset } from '@server/task/entities/asset.entity';
import { Member } from '@server/task/entities/space.entity';


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

  @ManyToMany(() => Member, (member) => member.user)
  members: Member[];

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.USER,
  })
  role: RoleType;

  @OneToMany(() => Comment, (comment) => comment.sender)
  comments: Comment[];

  @OneToMany(() => Asset, (asset) => asset.uploader)
  assets: Asset[];

  @DeleteDateColumn()
  @Exclude()
  deleteAt: Date;
}


@Entity()
export class ThirdAuth extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ThirdAuthType,
  })
  type: ThirdAuthType;

  @Column()
  uid: string;
}
