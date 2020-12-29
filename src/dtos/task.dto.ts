import {
  IsString,
  IsOptional,
  IsBooleanString,
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
import { Task, TaskState } from '../server/task/task.entity';
import { ListRes } from './misc.dto';
import { UserRes } from './user.dto';
import { OutputData } from '@editorjs/editorjs';
import { ActionType } from '@ant-design/pro-table';

export class CreateTaskDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  performerId?: number[];
}

export class CreateSubTaskDTO extends CreateTaskDTO {
  @Type(() => String)
  @Transform((v) => v === 'true')
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
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

@Exclude()
export class TaskRes {
  @Expose()
  id: number;

  @Expose()
  state: string;

  @Expose()
  name: string;

  @Expose()
  createAt: Date;

  @Expose()
  @Type(() => UserRes)
  performers: UserRes[];

  @Expose()
  isMandatory: boolean;

  @Expose()
  @Type(() => TaskRes)
  parentTask: TaskRes;

  constructor(partial: Partial<TaskRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class ContentRes {
  @Expose()
  content: OutputData;
}

@Exclude()
export class LogRes {
  @Expose()
  createAt: Date;
  
  @Expose()
  @Type(() => UserRes)
  executor: UserRes;

  @Expose()
  action: ActionType;
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
  startAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  description: string;

  @Expose()
  @Type(() => ContentRes)
  contents: ContentRes[];

  @Expose()
  @Type(() => LogRes)
  logs: LogRes[];

  @Expose()
  @Type(() => UserRes)
  performers: UserRes[];

  @Expose()
  isMandatory: boolean;

  @Expose()
  @Type(() => TaskRes)
  parentTask: TaskRes;

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
