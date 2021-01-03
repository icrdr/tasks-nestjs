import { Column, Entity, ManyToOne } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { Task } from "./task.entity";
import { BaseEntity } from "@server/common/common.entity";
import { TaskParticipant } from "./taskParticipant.entity";

export enum PropertyType {
  NUMBER = 'number',
  STRING = 'string',
  FORMULA = 'formula'
}

@Entity()
export class Property extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.properties)
  task: Task;

  @ManyToOne(() => TaskParticipant, (taskParticipant) => taskParticipant.properties)
  taskParticipant: TaskParticipant;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  type: PropertyType;

  @Column('simple-json')
  value: any;
}