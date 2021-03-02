import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { AccessLevel, Assignment, Member, Role, Space } from '../entities/space.entity';
import { unionArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { Task } from '../entities/task.entity';

@Injectable()
export class SpaceService {
  assignmentQuery: SelectQueryBuilder<Assignment>;
  memberQuery: SelectQueryBuilder<Member>;
  spaceQuery: SelectQueryBuilder<Space>;
  roleQuery: SelectQueryBuilder<Role>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private configService: ConfigService,
    private manager: EntityManager,
  ) {
    this.spaceQuery = this.manager
      .createQueryBuilder(Space, 'space')
      .leftJoinAndSelect('space.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('space.roles', 'sRole')
      .leftJoinAndSelect('space.assignments', 'assignment')
      .leftJoinAndSelect('assignment.role', 'role');

    this.assignmentQuery = this.manager
      .createQueryBuilder(Assignment, 'assignment')
      .leftJoinAndSelect('assignment.space', 'space')
      .leftJoinAndSelect('assignment.tasks', 'task')
      .leftJoinAndSelect('assignment.members', 'member')
      .leftJoinAndSelect('assignment.role', 'role')
      .leftJoinAndSelect('member.user', 'user');

    this.memberQuery = this.manager
      .createQueryBuilder(Member, 'member')
      .leftJoinAndSelect('member.space', 'space')
      .leftJoinAndSelect('member.user', 'user');

    this.roleQuery = this.manager
      .createQueryBuilder(Role, 'role')
      .leftJoinAndSelect('role.space', 'space');
  }

  async addRole(space: Space | number, name: string, access: AccessLevel) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.getSpace(space, false);
    let role = await this.getRoleByName(space.id, name, false);
    if (role) return role;

    role = new Role();
    role.name = name;
    role.access = access;
    role.space = space;
    return await this.manager.save(role);
  }

  async getRoleByName(space: Space | number, name: string, exception = true) {
    const spaceId = await this.getSpaceId(space);
    let query = this.roleQuery
      .clone()
      .andWhere('space.id = :spaceId', { spaceId })
      .andWhere('role.name = :name', { name });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException('Role was not found.');
    return role;
  }

  async getRole(identiy: number, exception = true) {
    let query = this.roleQuery.clone().andWhere('role.id = :identiy', { identiy });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException('Role was not found.');
    return role;
  }

  async addAssignment(
    scope: Space | Task,
    users: User[] | number[],
    roleName: string,
    roleAccess?: AccessLevel,
  ) {
    const space = scope instanceof Space ? scope : scope.space;
    const role = await this.addRole(space, roleName, roleAccess || AccessLevel.EDIT);
    const members = [];
    users = unionArrays(users);
    for await (const user of users) {
      const member = await this.getMember(space, user);
      members.push(member);
    }

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

  async getAssignment(id: number, exception = true) {
    const query = this.assignmentQuery.clone().where('assignment.id = :id', { id });
    const assignment = await query.getOne();
    if (!assignment && exception) throw new NotFoundException('Assignment was not found.');
    return assignment;
  }

  async removeAssignment(assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    await this.manager.delete(Assignment, assignment.id);
  }

  async addSpace(
    name: string,
    executor?: User | number,
    options: {
      admins?: User[] | number[];
      members?: User[] | number[];
      access?: AccessLevel;
      isPersonal?: boolean;
    } = {},
  ) {
    let space = new Space();
    space.name = name;
    space.isPersonal = options.isPersonal || false;
    if (options.access) space.access = options.access;
    space = await this.manager.save(space);
    //TODO: add log

    //add admin group
    if (options.admins) {
      const adminMembers = [];
      for (const admin of options.admins) {
        adminMembers.push(await this.addMember(space, admin));
      }
      await this.addAssignment(space, options.admins, '管理员', AccessLevel.FULL);
    }

    //add member
    if (options.members) {
      for (const member of options.members) {
        await this.addMember(space, member);
      }
    }
    return await this.getSpace(space.id);
  }

  async addMember(space: Space | number, user: User | number) {
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

  async getMember(space: Space | number, user: User | number, exception = true) {
    const spaceId = await this.getSpaceId(space);
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
      pageSize?: number;
      current?: number;
    } = {},
  ) {
    let query = this.memberQuery.clone();

    if (options.space) {
      const spaceId = await this.getSpaceId(options.space);
      query = query.where('space.id = :spaceId', { spaceId });
    }

    query = query
      .orderBy('space.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
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

  async isScopeAdmin(task: Task, user: User | number) {
    const superTaskId = task.superTask ? task.superTask.id : undefined;
    const spaceId = task.space.id;
    const userId = await this.userService.getUserId(user);
    if (task.space.access === AccessLevel.FULL || task.superTask?.access === AccessLevel.FULL)
      return true;

    let query = this.assignmentQuery
      .clone()
      .andWhere('user.id = :userId', { userId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('space.id = :spaceId', { spaceId }).orWhere('task.id = :superTaskId', {
            superTaskId,
          });
        }),
      )
      .andWhere('role.access = :roleAccess', {
        roleAccess: AccessLevel.FULL,
      });

    return !!(await query.getOne());
  }

  async getAssignments(scope: Space | Task, user: User | number) {
    const userId = await this.userService.getUserId(user);
    let query = this.assignmentQuery.clone().andWhere('user.id = :userId', { userId });

    query =
      scope instanceof Space
        ? query.andWhere('space.id = :spaceId', { spaceId: scope.id })
        : query.andWhere('task.id = :taskId', { taskId: scope.id });

    return await query.getMany();
  }

  async getSpaceAccess(space: Space | number, user: User | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    // 1. cheack if is space member
    if (!(await this.getMember(space, user))) return [];

    // 2. cheack all assignments of space and space default access
    const assignments = await this.getAssignments(space, user);
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

  async getRoleId(role: Role | number) {
    role = role instanceof Role ? role : await this.getRole(role);
    return role.id;
  }

  async getSpace(id: number, exception = true) {
    let query = this.spaceQuery.clone().where('space.id = :id', { id });
    const space = await query.getOne();
    if (!space && exception) throw new NotFoundException('Space was not found.');
    return space;
  }

  async getSpaces(
    options: {
      user?: User | number;
      isPersonal?: boolean;
      pageSize?: number;
      current?: number;
    } = {},
  ) {
    let query = this.spaceQuery.clone();

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere('user.id = :userId', { userId });
    }

    if (options.isPersonal) {
      query = query.andWhere('space.isPersonal = :isPersonal', { isPersonal: true });
    }

    // add all other member back.
    query = query
      .leftJoinAndSelect('space.members', '_member')
      .leftJoinAndSelect('_member.user', '_user');

    query = query
      .orderBy('space.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }
}
