import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { UserRes } from './user.dto';
import { User } from '../server/user/entities/user.entity';
import { Assignment, Role } from '../server/task/entities/space.entity';
import { AccessLevel } from '../server/common/common.entity';
import { RoleRes } from './role.dto';

export class GetAssignmentDTO extends ListDTO {}

export class ChangeAssignmentDTO {
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @IsOptional()
  @IsString()
  name?: string;
}

export class AddAssignmentDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  userId?: number[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsEnum(AccessLevel)
  roleAccess?: AccessLevel;
}

@Exclude()
export class AssignmentRes {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  @Transform((i) => (i ? new RoleRes(i) : null))
  role: Role;

  @Expose()
  @Transform((a) => (a ? a.map((i: User) => new UserRes(i)) : []))
  users: User[] | UserRes[];

  constructor(partial: Partial<AssignmentRes>) {
    Object.assign(this, partial);
  }
}

export class AssignmentListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Assignment) => new AssignmentRes(i)) : []))
  list: AssignmentRes[];

  constructor(partial: Partial<AssignmentListRes>) {
    super();
    Object.assign(this, partial);
  }
}
