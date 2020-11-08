import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createAt!: Date;

  @UpdateDateColumn()
  updateAt!: Date;
}

export enum UserGender {
  male = 'male',
  female = 'female',
}

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  fullName!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  mobile!: string;

  @Column({
    type: 'enum',
    enum: UserGender,
    nullable: true,
  })
  gender!: UserGender;

  @Column({ nullable: true })
  idNumber!: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles!: Role[];

  @ManyToMany(() => Perm, (perm) => perm.users)
  @JoinTable()
  perms!: Perm[];

  @DeleteDateColumn()
  deleteAt!: Date;
}

export enum ThirdAuthType {
  wechat = 'wechat',
}

@Entity()
export class ThirdAuth extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ThirdAuthType,
  })
  type!: string;

  @Column()
  uid!: string;
}

@Entity()
export class Role extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @ManyToMany(() => Perm, (perm) => perm.roles)
  @JoinTable()
  perms!: Perm[];

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}

@Entity()
export class Perm extends BaseEntity {
  @Column({ unique: true })
  code!: string;

  @ManyToMany(() => Role, (role) => role.perms)
  roles!: Role[];

  @ManyToMany(() => User, (user) => user.perms)
  users!: User[];
}
