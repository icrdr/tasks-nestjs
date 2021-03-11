import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Assignment, Member, Role, Space } from '../entities/space.entity';
import { unionArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { Task } from '../entities/task.entity';
import { AccessLevel, PropertyForm, PropertyType } from '../../common/common.entity';
import { MemberService } from './member.service';
import { AssignmentService } from './assignment.service';
import { RoleService } from './role.service';
import { PropertyService } from './property.service';

@Injectable()
export class SpaceService {
  spaceQuery: SelectQueryBuilder<Space>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private configService: ConfigService,
    private assignmentService: AssignmentService,
    private propertyService: PropertyService,
    private memberService: MemberService,
    private roleService: RoleService,
    private manager: EntityManager,
  ) {
    this.spaceQuery = this.manager
      .createQueryBuilder(Space, 'space')
      .leftJoinAndSelect('space.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('space.roles', 'sRole')
      .leftJoinAndSelect('space.assignments', 'assignment')
      .leftJoinAndSelect('space.properties', 'property')
      .leftJoinAndSelect('assignment.role', 'role')
      .leftJoinAndSelect('assignment.users', 'aUser');
  }

  async addSpace(
    name: string,
    executor?: User | number,
    options: {
      admins?: User[] | number[];
      members?: User[] | number[];
      taskProperties?: { name: string; form: PropertyForm; items?: any }[];
      memberProperties?: { name: string; form: PropertyForm; items?: any }[];
      assetProperties?: { name: string; form: PropertyForm; items?: any }[];
      access?: AccessLevel;
    } = {},
  ) {
    let space = new Space();
    space.name = name;
    if (options.access) space.access = options.access;
    space = await this.manager.save(space);
    //TODO: add log

    //add admin group
    if (options.admins) {
      const adminMembers = [];
      for (const admin of options.admins) {
        adminMembers.push(await this.memberService.addMember(space, admin));
      }
      const adminRole = await this.roleService.addRole(space, '管理员', AccessLevel.FULL);
      await this.assignmentService.addAssignment(options.admins, adminRole, {
        name: '管理员组',
        root: space,
        space,
      });
    }

    //add member
    if (options.members) {
      for (const member of options.members) {
        await this.memberService.addMember(space, member);
      }
    }

    if (options.taskProperties) {
      for (const property of options.taskProperties) {
        await this.propertyService.addProperty(
          space,
          property.name,
          PropertyType.TASK,
          property.form,
          property.items,
        );
      }
    }

    if (options.memberProperties) {
      for (const property of options.memberProperties) {
        await this.propertyService.addProperty(
          space,
          property.name,
          PropertyType.MEMBER,
          property.form,
          property.items,
        );
      }
    }

    if (options.assetProperties) {
      for (const property of options.assetProperties) {
        await this.propertyService.addProperty(
          space,
          property.name,
          PropertyType.ASSET,
          property.form,
          property.items,
        );
      }
    }

    return await this.getSpace(space.id);
  }

  // async addLog(space: Space | number, action: LogAction, executor?: User | number) {
  //   let log = new Log();
  //   space = space instanceof Space ? space : await this.getSpace(space);
  //   if(executor){
  //     executor = executor instanceof User ? executor : await this.userService.getUser(executor);
  //     log.executor = executor;
  //   }
  //   log.space = space;
  //   log.action = action;
  //   return await this.manager.save(log);
  // }

  async getSpaceAccess(space: Space | number, user: User | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    // 1. cheack if is space member
    if (!(await this.memberService.getMember(space, user))) return [];

    // 2. cheack all assignments of space and space default access
    const assignments = (
      await this.assignmentService.getAssignments({ space, user, all: true })
    )[0];
    let access = this.configService.get('taskAccess')[space.access];
    access = access ? [access] : [];

    assignments.forEach(
      (a) => (access = access.concat(this.configService.get('taskAccess')[a.role.access])),
    );
    return unionArrays(access);
  }

  async getSpaceId(space: Space | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    return space.id;
  }

  async getSpace(id: number, exception = true) {
    let query = this.spaceQuery.clone().where('space.id = :id', { id });
    const space = await query.getOne();
    if (!space && exception) throw new NotFoundException('Space was not found.');
    return space;
  }

  async changeSpace(space: Space | number, options: { name: string; access: AccessLevel }) {
    space = space instanceof Space ? space : await this.getSpace(space);
    if (options.name) space.name = options.name;
    if (options.access !== undefined) space.access = options.access;

    return await this.manager.save(space);
  }

  async getSpaces(
    options: {
      user?: User | number;
      pageSize?: number;
      current?: number;
      all?: boolean;
    } = {},
  ) {
    let query = this.spaceQuery.clone();

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere('user.id = :userId', { userId });
    }

    // add all other member back.
    query = query
      .leftJoinAndSelect('space.members', '_member')
      .leftJoinAndSelect('_member.user', '_user');

    query = query.orderBy('space.id', 'DESC');

    if (!options.all) {
      query = query.skip((options.current - 1) * options.pageSize || 0).take(options.pageSize || 5);
    }

    return await query.getManyAndCount();
  }
}
