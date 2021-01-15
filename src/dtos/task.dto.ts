import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateIf,
  IsDefined,
  IsNumberString,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Exclude, Expose, plainToClass, Transform, Type } from 'class-transformer';
import { ActionType, Member, Task, TaskContent, TaskLog, TaskState } from '../server/task/entities/task.entity';
import { ListRes } from './misc.dto';
import { OutputData } from '@editorjs/editorjs';
import { CommentType } from '../server/task/entities/comment.entity';
import { UserRes } from './user.dto';
import { User } from '../server/user/entities/user.entity';


export class CreateTaskDTO {
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


export class GetTasksDTO {
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @Transform((v) => Object.values(TaskState)) //check all state if is empty.
  @IsEnum(TaskState, { each: true })
  state?: TaskState[];
}

export class UpdateTaskDTO {
  @IsNotEmpty()
  content: OutputData;
}

export class ReviewTaskDTO {
  @Type(() => String)
  @Transform((v) => v === 'true')
  @IsBoolean()
  isConfirmed: boolean;
}

export class CommentDTO {
  taskId: number;
  content: string;
  type: CommentType;
}

@Exclude()
export class CommentRes {
  @Expose()
  createAt: Date;

  @Expose()
  @Transform((i) => (i ? new UserRes(i) : null))
  sender: UserRes;

  @Expose()
  content: string;

  @Expose()
  type: CommentType;

  constructor(partial: Partial<CommentRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ContentRes {
  @Expose()
  content: OutputData;

  constructor(partial: Partial<ContentRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class LogRes {
  @Expose()
  createAt: Date;

  @Expose()
  @Transform((i) => (i ? new UserRes(i) : null))
  executor: UserRes;

  @Expose()
  action: ActionType;

  constructor(partial: Partial<LogRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class MemberRes {
  user: User;

  @Expose()
  get userId(): number {
    return this.user.id;
  }

  @Expose()
  get username(): string {
    return this.user.username;
  }

  constructor(partial: Partial<MemberRes>) {
    Object.assign(this, partial);
  }
}

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
  createAt: Date;

  @Expose()
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : null))
  members: Member[] | MemberRes[];

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  @Expose()
  @Transform((a) => (a ? a.map((i: Task) => new TaskRes(i)) : null))
  subTasks: TaskRes[];

  constructor(partial: Partial<TaskRes>) {
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
  createAt: Date;

  @Expose()
  startAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  @Transform((a) => (a ? a.map((i: TaskContent) => new ContentRes(i)) : null))
  contents: ContentRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: TaskLog) => new LogRes(i)) : null))
  logs: LogRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : null))
  members: Member[] | MemberRes[];

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  @Expose()
  @Transform((a) => (a ? a.map((i: Task) => new TaskRes(i)) : null))
  subTasks: TaskRes[];

  constructor(partial: Partial<TaskMoreDetailRes>) {
    Object.assign(this, partial);
  }
}

export class TaskListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Task) => new TaskDetailRes(i)) : null))
  list: TaskDetailRes[];

  constructor(partial: Partial<TaskListRes>) {
    super();
    Object.assign(this, partial);
  }
}
