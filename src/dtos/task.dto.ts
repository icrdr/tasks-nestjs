import {
  IsString,
  IsOptional,
  IsBooleanString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateIf,
  IsDefined,
} from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Task, TaskState } from '../modules/task/task.entity';
import { ListRes } from './misc.dto';
import { UserRes } from './user.dto';

export class CreateTaskDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}

export class CreateSubTaskDTO extends CreateTaskDTO {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsBooleanString()
  isMandatory?: string;
}

export class GetTasksDTO {
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @Transform((v) => Object.values(TaskState))
  @IsEnum(TaskState, { each: true })
  state?: TaskState[];
}

export class SubmitRequestDTO {
  @IsOptional()
  @IsString()
  content?: string;
}

export class RespondRequestDTO {
  @IsBooleanString()
  isConfirmed: string;

  @IsOptional()
  @IsString()
  content?: string;
}

@Exclude()
export class TaskRes {
  @Expose()
  id: number;

  @Expose()
  state: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => UserRes)
  performers: UserRes[];

  @Expose()
  isMandatory: boolean;

  @Expose()
  @Type(() => TaskRes)
  parentTask:TaskRes

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
  @Type(() => UserRes)
  performers: UserRes[];

  @Expose()
  isMandatory: boolean;

  @Expose()
  @Type(() => TaskRes)
  parentTask:TaskRes

  constructor(partial: Partial<TaskRes>) {
    Object.assign(this, partial);
  }
}


export class TaskListRes extends ListRes {
  @Type(() => TaskRes)
  list: TaskRes[];

  constructor(partial: Partial<TaskListRes>) {
    super();
    Object.assign(this, partial);
  }
}
