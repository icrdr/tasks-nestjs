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
import { ListDTO, ListRes } from './misc.dto';
import { UserRes } from './user.dto';
import { User } from '../server/user/entities/user.entity';
import { Assignment, Member, Role, Space } from '../server/task/entities/space.entity';
import { AccessLevel } from '../server/common/common.entity';

export class GetMembersDTO extends ListDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class GetAssignmentDTO extends ListDTO {}

export class ChangeRoleDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;
}

export class ChangeAssetDTO {
  @IsOptional()
  @IsString()
  name?: string;
}

export class AddRoleDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;
}

export class ChangeSpaceDTO {
  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;

  @IsOptional()
  @IsString()
  name?: string;
}

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

export class AddSpaceDTO {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  adminId?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  memberId?: number[];
}

export class GetSpacesDTO extends ListDTO {}

@Exclude()
export class SpaceRes {
  @Expose()
  id: number;
  @Expose()
  name: string;
  constructor(partial: Partial<SpaceRes>) {
    Object.assign(this, partial);
  }
}

export class GetRolesDTO extends ListDTO {}

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
export class RoleRes {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  access: AccessLevel;

  constructor(partial: Partial<RoleRes>) {
    Object.assign(this, partial);
  }
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
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  members: Member[] | MemberRes[];

  constructor(partial: Partial<AssignmentRes>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class SpaceDetailRes {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createAt: Date;

  @Expose()
  access: AccessLevel;

  @Expose()
  userAccess: string;

  @Expose()
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  members: Member[] | MemberRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: Role) => new RoleRes(i)) : []))
  roles: Role[] | RoleRes[];

  constructor(partial: Partial<SpaceDetailRes>) {
    Object.assign(this, partial);
  }
}

export class RoleListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Role) => new RoleRes(i)) : []))
  list: RoleRes[];

  constructor(partial: Partial<RoleListRes>) {
    super();
    Object.assign(this, partial);
  }
}

export class MemberListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  list: MemberRes[];

  constructor(partial: Partial<MemberListRes>) {
    super();
    Object.assign(this, partial);
  }
}

export class SpaceListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Space) => new SpaceDetailRes(i)) : []))
  list: SpaceDetailRes[];

  constructor(partial: Partial<SpaceListRes>) {
    super();
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
