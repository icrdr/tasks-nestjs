import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { Role } from '../server/task/entities/space.entity';
import { AccessLevel } from '../server/common/common.entity';

export class GetRolesDTO extends ListDTO {}

export class ChangeRoleDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;
}

export class AddRoleDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;
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

export class RoleListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Role) => new RoleRes(i)) : []))
  list: RoleRes[];

  constructor(partial: Partial<RoleListRes>) {
    super();
    Object.assign(this, partial);
  }
}
