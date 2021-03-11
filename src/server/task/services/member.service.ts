import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Member, Space } from '../entities/space.entity';
import { SpaceService } from './space.service';
import { Property } from '../entities/property.entity';
import { PropertyService } from './property.service';

@Injectable()
export class MemberService {
  memberQuery: SelectQueryBuilder<Member>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => SpaceService))
    private spaceService: SpaceService,
    private propertyService: PropertyService,
    private manager: EntityManager,
  ) {
    this.memberQuery = this.manager
      .createQueryBuilder(Member, 'member')
      .leftJoinAndSelect('member.space', 'space')
      .leftJoinAndSelect('member.user', 'user');
  }

  async addMember(space: Space | number, user: User | number) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.spaceService.getSpace(space, false);
    user = user instanceof User ? user : await this.userService.getUser(user, false);
    if (!space || !user) return;
    let member = await this.getMember(space.id, user.id, false);
    if (member) return member;

    member = new Member();
    member.user = user;
    member.space = space;
    await this.manager.save(member);
    return await this.getMember(space.id, user.id, false);
  }

  async removeMember(space: Space | number, user: User | number) {
    const member = await this.getMember(space, user);
    await this.manager.delete(Member, member.id);
  }

  async changeMember(
    space: Space | number,
    user: User | number,
    options: { properties?: any } = {},
  ) {
    const member = await this.getMember(space, user);
    if (options.properties !== undefined) member.properties = options.properties;
    return await this.manager.save(member);
  }

  async getMember(space: Space | number, user: User | number, exception = true) {
    const spaceId = await this.spaceService.getSpaceId(space);
    const userId = await this.userService.getUserId(user);

    let query = this.memberQuery
      .clone()
      .andWhere('space.id = :spaceId', { spaceId })
      .andWhere('user.id = :userId', { userId });
    const member = await query.getOne();
    if (!member && exception) throw new NotFoundException('Member was not found.');
    return member;
  }

  async getMembers(
    options: {
      space?: Space | number;
      username?: string;
      nickName?: string;
      properties?: any;
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {},
  ) {
    let query = this.memberQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }
    if (options.username) {
      query = query.andWhere('user.username LIKE :username', {
        username: `%${options.username}%`,
      });
    }

    if (options.nickName) {
      query = query.andWhere('user.nickName LIKE :nickName', {
        nickName: `%${options.nickName}%`,
      });
    }

    if (options.properties) {
      for (const prop of options.properties) {
        const property =
          prop.property instanceof Property
            ? prop.property
            : await this.propertyService.getProperty(prop.property);

        query = query.andWhere(
          `member.properties ->'$.prop${property.id}' LIKE CONCAT('%','${prop.value}','%')`,
        );
      }
    }

    query = query.orderBy('space.id', 'DESC');

    if (!options.skip || !options.take) {
      query = query.skip((options.current - 1) * options.pageSize || 0).take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }

    return await query.getManyAndCount();
  }
}
