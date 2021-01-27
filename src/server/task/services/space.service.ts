import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { accessLevel, Assignment, LogAction, Member, Role, Space } from '../entities/space.entity';
import { unionArrays, unionEntityArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { Task } from '../entities/task.entity';

@Injectable()
export class SpaceService {
  groupQuery: SelectQueryBuilder<Assignment>;
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private manager: EntityManager,
  ) {
    // this.groupQuery = this.manager
    //   .createQueryBuilder(Group, 'group')
    //   .leftJoinAndSelect('group.members', 'member')
    //   .leftJoinAndSelect('member.user', 'user')
    //   .leftJoinAndSelect('group.space', 'space');
  }

  async createRole(space: Space | number, name: string, access: accessLevel) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.getSpace(space, false);
    let role = await this.getRole(space.id, name, false);
    if (role) return role;

    role = new Role();
    role.name = name;
    role.access = access;
    role.space = space;
    return await this.manager.save(role);
  }

  async getRole(space: Space | number, name: string, exception = true) {
    const spaceId = await this.getSpaceId(space);
    let query = this.manager
      .createQueryBuilder(Role, 'role')
      .leftJoinAndSelect('role.space', 'space')
      .where('space.id = :spaceId', { spaceId })
      .andWhere('role.name = :name', { name });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException('Member was not found.');
    return role;
  }

  async createAssignment(
    scope: Space | Task,
    roleName: string,
    roleAccess: accessLevel,
    members: Member[] = [],
  ) {
    members = unionArrays(members);
    const space = scope instanceof Space ? scope : scope.space;
    const role = await this.createRole(space, roleName, roleAccess);

    let assignment = new Assignment();
    assignment.role = role;
    assignment.members = members;

    if (scope instanceof Space) {
      assignment.space = scope;
    } else {
      assignment.tasks = [scope];
    }

    return await this.manager.save(assignment);
  }

  async createSpace(
    name: string,
    executor?: User | number | string,
    options: {
      admins?: User[] | number[] | string[];
      members?: User[] | number[] | string[];
    } = {},
  ) {
    let space = new Space();
    space.name = name;
    space = await this.manager.save(space);
    //TODO: add log

    const executorMember = await this.createMember(space, executor);

    //create admin group
    if (options.admins) {
      space.access = accessLevel.VIEW;
      await this.manager.save(space);

      const adminAssignment = await this.createAssignment(space, 'admin', accessLevel.FULL);
      adminAssignment.members.push(executorMember);
      for (const admin of options.admins) {
        const adminMember = await this.createMember(space, admin);
        if (adminMember) adminAssignment.members.push(adminMember);
      }
      adminAssignment.members = unionEntityArrays(adminAssignment.members);
      await this.manager.save(adminAssignment);
    } else {
      space.access = accessLevel.FULL;
      await this.manager.save(space);
    }

    //add member
    if (options.members)
      for (const member of options.members) {
        await this.createMember(space, member);
      }
    return await this.getSpace(space.id);
  }

  async createMember(space: Space | number, user: User | number | string) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.getSpace(space, false);
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

  async getMember(space: Space | number, user: User | number | string, exception = true) {
    const spaceId = await this.getSpaceId(space);
    const userId = await this.userService.getUserId(user);

    let query = this.manager
      .createQueryBuilder(Member, 'member')
      .leftJoinAndSelect('member.space', 'space')
      .leftJoinAndSelect('member.user', 'user')
      .where('space.id = :spaceId', { spaceId })
      .andWhere('user.id = :userId', { userId });
    const member = await query.getOne();
    if (!member && exception) throw new NotFoundException('Member was not found.');
    return member;
  }

  // async createLog(space: Space | number, action: LogAction, executor?: User | number | string) {
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

  async getSpaceAccess(space: Space | number, user: User | number | string) {
    space = space instanceof Space ? space : await this.getSpace(space);
    const spaceId = space.id;
    const userId = await this.userService.getUserId(user);
    let query = this.manager
      .createQueryBuilder(Assignment, 'assignment')
      .leftJoinAndSelect('assignment.space', 'space')
      .leftJoinAndSelect('assignment.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('space.id = :taskId', { spaceId })
      .andWhere('user.id = :userId', { userId });

    const assignments = await query.getMany();
    let access = this.configService.get('taskAccess')[space.access];
    assignments.forEach(
      (a) => (access = access.concat(this.configService.get('taskAccess')[a.role.access])),
    );
    return unionArrays(access);
  }

  async getSpaceId(space: Space | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    return space.id;
  }

  async getSpace(identify: number, exception = true) {
    let query = this.manager.createQueryBuilder(Space, 'space');
    query = query.where('space.id = :id', { id: identify });

    const space = await query.getOne();
    if (!space && exception) throw new NotFoundException('Space was not found.');
    return space;
  }
}
