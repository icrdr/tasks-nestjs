import { IsString, IsNumberString, IsOptional, IsNumber } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListRes } from './misc.dto';
import { Role, User } from '@server/user/entities/user.entity';
import { isStringArray } from '@utils/typeGuard';
import { StsTokenRes } from './asset.dto';
import { unionArrays } from '../utils/utils';

export class LoginDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class CreateUserDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  roles?: string[];
}

export class GetUsersDTO {
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

@Exclude()
export class UserRes {
  @Expose()
  id: number;
  @Expose()
  username: string;

  constructor(partial: Partial<UserRes>) {
    Object.assign(this, partial);
  }
}

export class UserListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: User) => new UserRes(i)) : null))
  list: UserRes[];

  constructor(partial: Partial<UserListRes>) {
    super();
    Object.assign(this, partial);
  }
}

@Exclude()
export class CurrentUserRes {
  roles: Role[];

  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  get access(): string[] {
    const allAccess = this.roles.map((role) => role.access);
    return unionArrays(allAccess);
  }

  @Expose()
  get roleNames(): string[] {
    return this.roles.map((role) => role.name);
  }

  constructor(partial: Partial<CurrentUserRes>) {
    Object.assign(this, partial);
  }
}

export class CurrentUserTokenRes {
  @Transform((i) => (i ? new CurrentUserRes(i) : null))
  currentUser: User | CurrentUserRes;

  token: string;

  constructor(partial: Partial<CurrentUserTokenRes>) {
    Object.assign(this, partial);
  }
}
