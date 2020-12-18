import { IsString, IsNumberString, IsOptional, IsNumber } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListRes } from './misc.dto';
import { Perm, Role, User } from '@server/user/entities/user.entity';
import { isStringArray } from '@utils/typeGuard';

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
  @Type(() => UserRes)
  list: UserRes[];

  constructor(partial: Partial<UserListRes>) {
    super();
    Object.assign(this, partial);
  }
}

@Exclude()
export class CurrentUserRes {
  @Expose()
  id: number;

  @Expose()
  username: string;

  private roles: Role[];

  @Expose()
  permCodes: string[];

  @Expose()
  get roleNames(): string[] {
    return this.roles.map((item) => item.name);
  }

  constructor(partial: Partial<CurrentUserRes>) {
    Object.assign(this, partial);
  }
}

export class CurrentUserTokenRes {
  @Type(() => CurrentUserRes)
  currentUser: CurrentUserRes;

  token: string;

  constructor(partial: Partial<CurrentUserTokenRes>) {
    Object.assign(this, partial);
  }
}
