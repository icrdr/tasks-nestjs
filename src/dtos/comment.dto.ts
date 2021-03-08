import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { CommentType } from '../server/common/common.entity';
import { ListDTO, ListRes } from './misc.dto';
import { UserRes } from './user.dto';
import { Comment } from '../server/task/entities/comment.entity';

export class CommentDTO {
  taskId: number;
  content: string;
  type: CommentType;
}

export class GetCommentsDTO extends ListDTO {
  @IsOptional()
  @IsDate()
  dateAfter?: Date;

  @IsOptional()
  @IsDate()
  dateBefore?: Date;
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

export class CommentListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Comment) => new CommentRes(i)) : []))
  list: CommentRes[];

  constructor(partial: Partial<CommentListRes>) {
    super();
    Object.assign(this, partial);
  }
}
