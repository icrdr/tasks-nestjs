import { IsString, IsOptional } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ListDTO, ListRes } from './misc.dto';
import { User } from '../server/user/entities/user.entity';
import { Member } from '../server/task/entities/space.entity';

export class GetMembersDTO extends ListDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  nickname?: string;
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

export class MemberListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Member) => new MemberRes(i)) : []))
  list: MemberRes[];

  constructor(partial: Partial<MemberListRes>) {
    super();
    Object.assign(this, partial);
  }
}
