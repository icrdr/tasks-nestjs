import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { Task } from "./task.entity";
import { BaseEntity, CommentType } from "@server/common/common.entity";

@Entity()
export class Comment extends BaseEntity {
  @ManyToOne(() => User, (User) => User.comments, { nullable: true })
  sender: User;

  @ManyToOne(() => Task, (task) => task.comments)
  task: Task;

  @Column('text', { nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: CommentType,
  })
  type: CommentType;
}