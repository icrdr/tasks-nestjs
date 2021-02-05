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
import { Task, Content, TaskState } from '../server/task/entities/task.entity';
import { ListDTO, ListRes } from './misc.dto';
import { OutputData } from '@editorjs/editorjs';
import { CommentType } from '../server/task/entities/comment.entity';
import { UserRes } from './user.dto';
import { User } from '../server/user/entities/user.entity';
import { Assignment, Member, Role } from '../server/task/entities/space.entity';
import { AssignmentRes } from './space.dto';

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

export class GetTasksDTO extends ListDTO {
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
  access: string;

  @Expose()
  createAt: Date;

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  @Expose()
  @Transform((a) => (a ? a.map((i: Task) => new TaskRes(i)) : []))
  subTasks: TaskRes[];

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
  createAt: Date;

  @Expose()
  startAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  access: string;

  @Expose()
  @Transform((a) => (a ? a.map((i: Content) => new ContentRes(i)) : []))
  contents: ContentRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: Assignment) => new AssignmentRes(i)) : []))
  assignments: Assignment[] | AssignmentRes[];

  @Expose()
  @Transform((i) => (i ? new TaskRes(i) : null))
  superTask: TaskRes;

  @Expose()
  @Transform((a) => (a ? a.map((i: Task) => new TaskRes(i)) : []))
  subTasks: TaskRes[];

  constructor(partial: Partial<TaskMoreDetailRes>) {
    Object.assign(this, partial);
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
