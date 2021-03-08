import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { Member, Role, Space } from '../server/task/entities/space.entity';
import { AccessLevel, PropertyType } from '../server/common/common.entity';
import { MemberRes } from './member.dto';
import { RoleRes } from './role.dto';
import { Property } from '../server/task/entities/property.entity';
import { PropertyRes } from './property.dto';

export class ChangeSpaceDTO {
  @IsOptional()
  @IsEnum(AccessLevel)
  access?: AccessLevel;

  @IsOptional()
  @IsString()
  name?: string;
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

  properties: Property[];

  @Expose()
  get taskProperties(): PropertyRes[] {
    return this.properties
      .filter((p) => p.type === PropertyType.TASK)
      .map((i: Property) => new PropertyRes(i));
  }
  @Expose()
  get memberProperties(): PropertyRes[] {
    return this.properties
      .filter((p) => p.type === PropertyType.MEMBER)
      .map((i: Property) => new PropertyRes(i));
  }
  @Expose()
  get assetProperties(): PropertyRes[] {
    return this.properties
      .filter((p) => p.type === PropertyType.ASSET)
      .map((i: Property) => new PropertyRes(i));
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
