import { BaseEntity } from "@server/common/common.entity";
import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { Task } from "./task.entity";
import { Property } from "./property.entity";

@Entity()
export class TaskParticipant extends BaseEntity {
  @OneToMany(() => Property, (Property) => Property.taskParticipant)
  properties: Property[];

  @Column('simple-json', { nullable: true })
  permissions: string[];

  @ManyToOne(() => Task, (task) => task.taskParticipants)
  task: Task;

  @ManyToOne(() => User, (user) => user.taskParticipants)
  participant: User;
}
