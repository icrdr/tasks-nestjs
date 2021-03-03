import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Task, Content, TaskState } from '../server/task/entities/task.entity';
import { ListDTO, ListRes } from './misc.dto';
import { OutputData } from '@editorjs/editorjs';
import { Comment, CommentType } from '../server/task/entities/comment.entity';
import { UserRes } from './user.dto';
import { AccessLevel, Assignment, Space } from '../server/task/entities/space.entity';
import { AssignmentRes } from './space.dto';
import { Asset } from '../server/task/entities/asset.entity';

export class AddAssetDTO {
  @IsString()
  name: string;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}

export class ChangeTaskDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TaskState)
  state?: TaskState;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;

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

export class GetCommentsDTO extends ListDTO {
  @IsOptional()
  @IsDate()
  dateAfter?: Date;

  @IsOptional()
  @IsDate()
  dateBefore?: Date;
}

export class GetAssetsDTO extends ListDTO {
  @IsOptional()
  @IsNumber()
  taskId?: number;

  @IsOptional()
  @IsNumber()
  spaceId?: number;

  @Type(() => String)
  @IsOptional()
  @Transform((v) => v === 'true')
  @IsBoolean()
  isRoot?: boolean;
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
  type: string;

  @Expose()
  index: number;

  constructor(partial: Partial<CommentRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class AssetRes {
  @Expose()
  id: number;

  @Expose()
  createAt: Date;

  @Expose()
  @Transform((i) => (i ? new UserRes(i) : null))
  uploader: UserRes;

  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  format: string;

  @Expose()
  size: number;

  @Expose()
  source: string;

  @Expose()
  preview: string;

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
  beginAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  dueAt: Date;

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
  createAt: Date;

  @Expose()
  beginAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  dueAt: Date;

  @Expose()
  access: string;

  @Expose()
  userAccess: string;

  @Expose()
  @Transform((a) => (a ? a.map((i: Content) => new ContentRes(i)) : []))
  contents: ContentRes[];

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

export class CommentListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Comment) => new CommentRes(i)) : []))
  list: CommentRes[];

  constructor(partial: Partial<CommentListRes>) {
    super();
    Object.assign(this, partial);
  }
}

export class AssetListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Asset) => new AssetRes(i)) : []))
  list: AssetRes[];

  constructor(partial: Partial<AssetListRes>) {
    super();
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
