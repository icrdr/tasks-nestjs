import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { Task } from "./task.entity";
import { BaseEntity } from "@server/common/common.entity";

export enum ActionType {
  START = 'start',
  RESTART = 'restart',
  SUSPEND = 'suspend',
  COMPLETE = 'complete',
  COMMIT = 'commit',
  REFUSE = 'refuse',
  CREATE = 'create',
  UPDATA = 'update',
  DELETE = 'delete',
}

@Entity()
export class TaskLog extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.logs)
  task: Task;

  @ManyToOne(() => User, (User) => User.taskLogs, { nullable: true })
  executor: User;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action: ActionType;
}