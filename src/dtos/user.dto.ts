import { IsString, IsNumberString, IsOptional, IsNumber } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListRes } from './misc.dto';
import {  User } from '@server/user/entities/user.entity';
import { isStringArray } from '@utils/typeGuard';
import { StsTokenRes } from './asset.dto';
import { unionArrays } from '../utils/utils';
import { SpaceDetailRes } from './space.dto';

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
  @Transform((a) => (a ? a.map((i: User) => new UserRes(i)) : []))
  list: UserRes[];

  constructor(partial: Partial<UserListRes>) {
    super();
    Object.assign(this, partial);
  }
}

@Exclude()
export class CurrentUserRes {
  @Expose()
  role: string;

  @Expose()
  id: number;

  @Expose()
  username: string;

  constructor(partial: Partial<CurrentUserRes>) {
    Object.assign(this, partial);
  }
}

export class CurrentUserTokenRes {
  @Transform((i) => (i ? new CurrentUserRes(i) : null))
  currentUser: User | CurrentUserRes;

  personalSpace: SpaceDetailRes;

  token: string;

  constructor(partial: Partial<CurrentUserTokenRes>) {
    Object.assign(this, partial);
  }
}
