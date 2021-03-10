import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Task, Content } from '../server/task/entities/task.entity';
import { ListDTO, ListRes } from './misc.dto';
import { OutputData } from '@editorjs/editorjs';
import { Assignment, Space } from '../server/task/entities/space.entity';
import { AccessLevel, TaskState } from '../server/common/common.entity';
import { AssignmentRes } from './assignment.dto';
import { User } from '../server/user/entities/user.entity';

export class ChangeTaskDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(TaskState)
  state?: TaskState;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;

  @IsOptional()
  properties?: any;

  @IsOptional()
  @IsDate()
  beginAt?: Date;

  @IsOptional()
  @IsDate()
  dueAt?: Date;
}

export class AddTaskDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TaskState)
  state?: TaskState;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  memberId?: number[];
}

export class GetTasksDTO extends ListDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform((v) => v || Object.values(TaskState)) //check all state if is empty.
  @IsEnum(TaskState, { each: true })
  state?: TaskState[];

  @IsOptional()
  @IsDate()
  dueAfter?: Date;

  @IsOptional()
  @IsDate()
  dueBefore?: Date;

  @IsOptional()
  properties?: any;
}

export class ReviewTaskDTO {
  @Type(() => String)
  @Transform((v) => v === 'true')
  @IsBoolean()
  isConfirmed: boolean;
}

@Exclude()
export class ContentRes {
  @Expose()
  id: number;

  @Expose()
  createAt: Date;

  @Expose()
  content: OutputData;

  constructor(partial: Partial<ContentRes>) {
    Object.assign(this, partial);
  }
}

// @Exclude()
// export class LogRes {
//   @Expose()
//   createAt: Date;

//   @Expose()
//   @Transform((i) => (i ? new UserRes(i) : null))
//   executor: UserRes;

//   @Expose()
//   action: ActionType;

//   constructor(partial: Partial<LogRes>) {
//     Object.assign(this, partial);
//   }
// }

@Exclude()
export class TaskRes {
  @Expose()
  id: number;
  @Expose()
  name: string;
  constructor(partial: Partial<TaskRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskDetailRes {
  @Expose()
  id: number;

  @Expose()
  state: string;

  @Expose()
  name: string;

  @Expose()
  priority: number;

  @Expose()
  access: AccessLevel;

  @Expose()
  createAt: Date;

  @Expose()
  beginAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  dueAt: Date;

  @Expose()
  properties: any;

  contents: Content[];

  @Expose()
  get content(): ContentRes {
    if (this.contents) {
      return new ContentRes(this.contents[this.contents.length - 1]);
    } else {
      return null;
    }
  }

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  assignments: Assignment[];
  space: Space;

  @Expose()
  get roles(): any {
    const _roles = {};
    for (const role of this.space.roles) {
      const a = this.assignments.filter((a) => a.role.id === role.id);
      _roles[role.id] = a.map((i: Assignment) => new AssignmentRes(i));
    }
    return _roles;
  }

  constructor(partial: Partial<TaskDetailRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskMoreDetailRes {
  @Expose()
  id: number;

  @Expose()
  state: string;

  @Expose()
  name: string;

  @Expose()
  priority: number;

  @Expose()
  createAt: Date;

  @Expose()
  beginAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  dueAt: Date;

  @Expose()
  access: AccessLevel;

  currentUser: User;

  assignments: Assignment[];
  @Expose()
  get userAccess(): string {
    if (!this.currentUser || this.assignments.length === 0) return null;
    const accessPriority = [AccessLevel.VIEW, AccessLevel.EDIT, AccessLevel.FULL];
    const userAccess = [accessPriority.indexOf(this.access)];
    this.assignments.map((a) => {
      const u = a.users.filter((u) => u.id === this.currentUser.id);
      if (u.length > 0) userAccess.push(accessPriority.indexOf(a.role.access));
    });
    const index = Math.max(...userAccess);
    return index >= 0 ? accessPriority[index] : null;
  }

  @Expose()
  properties: any;

  @Expose()
  @Transform((a) => (a ? a.map((i: Content) => new ContentRes(i)) : []))
  contents: ContentRes[];

  space: Space;

  @Expose()
  get roles(): any {
    const _roles = {};
    for (const role of this.space.roles) {
      const a = this.assignments.filter((a) => a.role.id === role.id);
      _roles[role.id] = a.map((i: Assignment) => new AssignmentRes(i));
    }
    return _roles;
  }

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  @Expose()
  @Transform((a) => (a ? a.map((i: Task) => new TaskRes(i)) : []))
  subTasks: TaskRes[];

  constructor(partial: Partial<TaskMoreDetailRes>, currentUser?: User) {
    Object.assign(this, partial);
    this.currentUser = currentUser;
  }
}

export class TaskListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Task) => new TaskDetailRes(i)) : []))
  list: TaskDetailRes[];

  constructor(partial: Partial<TaskListRes>) {
    super();
    Object.assign(this, partial);
  }
}
