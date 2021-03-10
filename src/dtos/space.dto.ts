import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { Assignment, Member, Role, Space } from '../server/task/entities/space.entity';
import { AccessLevel, PropertyType } from '../server/common/common.entity';
import { MemberRes } from './member.dto';
import { RoleRes } from './role.dto';
import { Property } from '../server/task/entities/property.entity';
import { PropertyRes } from './property.dto';
import { User } from '../server/user/entities/user.entity';

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

  currentUser: User;
  assignments: Assignment[];

  @Expose()
  get userAccess(): string {
    if (!this.currentUser || this.assignments.length===0) return null;
    const accessPriority = [AccessLevel.VIEW, AccessLevel.EDIT, AccessLevel.FULL];
    const userAccess = [accessPriority.indexOf(this.access)];
    this.assignments.map((a) => {
      const u = a.users.filter((u) => u.id === this.currentUser.id);
      if (u.length > 0) userAccess.push(accessPriority.indexOf(a.role.access));
    });
    const index = Math.max(...userAccess);
    return index >= 0 ? accessPriority[index] : null;
  }

  @Expose()
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  members: Member[] | MemberRes[];

  @Expose()
  @Transform((a) => (a ? a.map((i: Role) => new RoleRes(i)) : []))
  roles: Role[] | RoleRes[];

  constructor(partial: Partial<SpaceDetailRes>, currentUser?: User) {
    Object.assign(this, partial);
    this.currentUser = currentUser;
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
