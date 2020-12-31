import { BaseEntity } from '../common/common.entity';
import { Entity, Column, ManyToMany } from 'typeorm';
import { Task } from '../task/entities/task.entity';

@Entity()
export class Tag extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @ManyToMany(() => Task, (task) => task.tags)
  tasks: Task[];
}
