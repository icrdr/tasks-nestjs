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
import { UserRes } from './user.dto';
import { User } from '../server/user/entities/user.entity';
import { AccessLevel, Assignment, Member, Role, Space } from '../server/task/entities/space.entity';
export class AddAssignmentDTO {
  @Type(() => Number)
  @IsNumber({}, { each: true })
  userId: number[];

  @IsString()
  roleName: string;

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

export class GetSpacesDTO extends ListDTO {
  @Type(() => String)
  @Transform((v) => v === 'true')
  @IsBoolean()
  @IsOptional()
  isPersonal: boolean;
}

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
export class AssignmentRes {
  @Expose()
  id: number;

  role: Role;

  @Expose()
  get roleName(): string {
    return this.role.name;
  }

  @Expose()
  get roleAccess(): string {
    return this.role.access;
  }

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
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  members: Member[] | MemberRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: Role) => i.name) : []))
  roles: Role[] | string[];

  constructor(partial: Partial<SpaceDetailRes>) {
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
