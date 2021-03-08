import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Assignment, Member, Role, Space } from '../entities/space.entity';
import { unionArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { Task } from '../entities/task.entity';
import { TaskService } from './task.service';
import { AccessLevel } from '../../common/common.entity';
import { RoleService } from './role.service';
import { SpaceService } from './space.service';
import { MemberService } from './member.service';

@Injectable()
export class AssignmentService {
  assignmentQuery: SelectQueryBuilder<Assignment>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
    @Inject(forwardRef(() => SpaceService))
    private spaceService: SpaceService,
    private roleService: RoleService,
    private memberService: MemberService,
    private manager: EntityManager,
  ) {
    this.assignmentQuery = this.manager
      .createQueryBuilder(Assignment, 'assignment')
      .leftJoinAndSelect('assignment.space', 'space')
      .leftJoinAndSelect('assignment.root', 'root')
      .leftJoinAndSelect('assignment.tasks', 'task')
      .leftJoinAndSelect('assignment.users', 'user')
      .leftJoinAndSelect('assignment.role', 'role');
  }

  async appendAssignment(scope: Task | Space, assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    if (scope instanceof Task) {
      assignment.tasks.push(scope);
    } else {
      assignment.space = scope;
    }
    return await this.manager.save(assignment);
  }

  async addAssignment(
    users: User[] | number[],
    role: Role | number,
    options: {
      name?: string;
      root?: Space | number;
      space?: Space | number;
      task?: Task | number;
    } = {},
  ) {
    role = role instanceof Role ? role : await this.roleService.getRole(role);
    if (!options.space && !options.root && !options.task)
      throw new NotFoundException('space or root should not be empty');

    let space: Space, task: Task, root: Space;

    if (options.task) {
      task =
        options.task instanceof Task ? options.task : await this.taskService.getTask(options.task);
      space = task.space;
    }

    if (options.space) {
      space =
        options.space instanceof Space
          ? options.space
          : await this.spaceService.getSpace(options.space);
    }

    if (options.root) {
      root =
        options.root instanceof Space
          ? options.root
          : await this.spaceService.getSpace(options.root);
    }

    const _users = [];
    users = unionArrays(users);
    for await (let user of users) {
      user = user instanceof User ? user : await this.userService.getUser(user);
      const member = await this.memberService.getMember(space || root, user, false);
      if (member) _users.push(user);
    }

    let assignment = new Assignment();
    assignment.role = role;
    assignment.users = _users;
    if (options.name) assignment.name = options.name;
    if (options.task) assignment.tasks = [task];
    if (options.space) assignment.space = space;
    if (options.root) assignment.root = root;

    return await this.manager.save(assignment);
  }

  async changeAssignment(
    assignment: Assignment | number,
    options: { name: string; role: Role | number },
  ) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    if (options.name) assignment.name = options.name;
    if (options.role) {
      const role =
        options.role instanceof Role ? options.role : await this.roleService.getRole(options.role);
      assignment.role = role;
    }

    return await this.manager.save(assignment);
  }

  async addAssignmentMember(assignment: Assignment | number, user: User | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    const space = assignment.root || assignment.space;
    user = user instanceof User ? user : await this.userService.getUser(user);
    await this.memberService.getMember(space, user);
    assignment.users.push(user);
    return await this.manager.save(assignment);
  }

  async removeAssignmentMember(assignment: Assignment | number, user: User | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    user = user instanceof User ? user : await this.userService.getUser(user);

    assignment.users = assignment.users.filter((user) => user.id !== (user as User).id);

    return await this.manager.save(assignment);
  }

  async getAssignment(id: number, exception = true) {
    const query = this.assignmentQuery.clone().where('assignment.id = :id', { id });
    const assignment = await query.getOne();
    if (!assignment && exception) throw new NotFoundException('Assignment was not found.');
    return assignment;
  }

  async deleteAssignment(assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);
    await this.manager.delete(Assignment, assignment.id);
  }

  async removeAssignment(assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment ? assignment : await this.getAssignment(assignment);

    await this.deleteAssignment(assignment);
  }

  async getAssignments(
    options: {
      root?: Space | number;
      space?: Space | number;
      task?: Task | number;
      user?: User | number;
      role?: Role | number;
      current?: number;
      pageSize?: number;
      all?: boolean;
    } = {},
  ) {
    let query = this.assignmentQuery.clone();

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere('user.id = :userId', { userId });
    }

    if (options.task) {
      const taskId = await this.taskService.getTaskId(options.task);
      query = query.andWhere('task.id = :taskId', { taskId });
    }

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }
    if (options.root) {
      const rootId = await this.spaceService.getSpaceId(options.root);
      query = query.andWhere('root.id = :rootId', { rootId });
    }

    if (options.role) {
      const roleId = await this.roleService.getRoleId(options.role);
      query = query.andWhere('role.id = :roleId', { roleId });
    }

    if (!options.all) {
      query = query
        .orderBy('space.id', 'DESC')
        .skip((options.current - 1) * options.pageSize || 0)
        .take(options.pageSize || 5);
    }

    return await query.getManyAndCount();
  }

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
}
