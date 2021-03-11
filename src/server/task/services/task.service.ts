import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task, Content } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { Role, Space } from '../entities/space.entity';
import { unionArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { SpaceService } from './space.service';
import { Comment } from '../entities/comment.entity';
import { AccessLevel, TaskState } from '../../common/common.entity';
import { AssignmentService } from './assignment.service';
import { MemberService } from './member.service';
import { RoleService } from './role.service';
import { Property } from '../entities/property.entity';
import { PropertyService } from './property.service';

@Injectable()
export class TaskService {
  taskQuery: SelectQueryBuilder<Task>;

  constructor(
    private userService: UserService,
    @Inject(forwardRef(() => SpaceService))
    private spaceService: SpaceService,
    private configService: ConfigService,
    @Inject(forwardRef(() => AssignmentService))
    private assignmentService: AssignmentService,
    private propertyService: PropertyService,
    private memberService: MemberService,
    private roleService: RoleService,
    private manager: EntityManager,
  ) {
    this.taskQuery = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.assignments', 'assignment')
      .leftJoinAndSelect('assignment.users', 'user')
      .leftJoinAndSelect('assignment.role', 'role')
      .leftJoinAndSelect('task.space', 'space')
      .leftJoinAndSelect('space.roles', 'sRole')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask')
      .leftJoinAndSelect('task.subTasks', 'subTask');
  }

  async checkParentTaskNotInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let superTask = task.superTask;
    if (superTask) {
      if (!states.includes(superTask.state))
        throw new ForbiddenException(`Parent task is restricted, forbidden action.`);
      this.checkParentTaskNotInStates(superTask, states);
    }
  }

  async addTask(
    space: Space | number,
    name: string,
    executor?: User | number,
    options: {
      admins?: User[] | number[];
      state?: TaskState;
      access?: AccessLevel;
    } = {},
  ) {
    space = space instanceof Space ? space : await this.spaceService.getSpace(space);
    let task = new Task();
    task.space = space;
    task.name = name;
    if (options.access) task.access = options.access;
    if (options.state) task.state = options.state;
    task = await this.manager.save(task);
    //log
    if (options.admins) {
      const adminMembers = [];
      for (const admin of options.admins) {
        adminMembers.push(await this.memberService.addMember(space, admin));
      }
      const roles = (await this.roleService.getRoles({ space, access: AccessLevel.FULL }))[0];
      await this.assignmentService.addAssignment(options.admins, roles[0], {
        task,
      });
    }

    return await this.getTask(task.id);
  }

  async addSubTask(
    task: Task | number,
    name: string,
    executor?: User | number,
    options: {
      state?: TaskState;
    } = {},
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state === TaskState.UNCONFIRMED || task.state === TaskState.COMPLETED)
      throw new ForbiddenException(
        'Task is freezed (completed or unconfirmed), \
        forbidden subtask creation.',
      );

    await this.checkParentTaskNotInStates(task, [TaskState.SUSPENDED, TaskState.IN_PROGRESS]);

    const subTask = await this.addTask(task.space, name, executor, options);
    subTask.superTask = task;
    await this.manager.save(subTask);
    // TODO: closure-table does not update when compounent'parent update yet. so we update it maunaly.
    // await this.manager.query(
    //   `UPDATE task_closure SET id_ancestor = ${task.id} WHERE id_descendant = ${subTask.id}`,
    // );
    return await this.getTask(task.id);
  }

  async getTaskAccess(task: Task | number, user: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);

    // 1. cheack if is space member
    if (!(await this.memberService.getMember(task.space, user))) return [];

    // 2. cheack if is scope admin
    if (await this.assignmentService.isScopeAdmin(task, user)) return ['common.*'];

    // 3. cheack all assignments of task and task default access
    const assignments = (await this.assignmentService.getAssignments({ task, user, all: true }))[0];
    let access = this.configService.get('taskAccess')[task.access];
    access = access ? [access] : [];

    assignments.forEach(
      (a) => (access = access.concat(this.configService.get('taskAccess')[a.role.access])),
    );

    return unionArrays(access);
  }

  async removeTask(task: Task | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    this.manager.softDelete(Task, task.id);
  }

  async getTask(id: number, exception = true) {
    const query = this.taskQuery.clone().where('task.id = :id', { id });
    const task = await query.getOne();
    if (!task && exception) throw new NotFoundException('Task was not found.');
    return task;
  }

  async getTasks(
    options: {
      space?: Space | number;
      user?: User | number;
      superTask?: Task | number;
      isRoot?: boolean;
      roles?: { role: Role | number; user: User | number }[];
      name?: string;
      properties?: { property: Property | number; value: any }[];
      state?: TaskState[] | TaskState;
      beginAt?: [Date?, Date?];
      dueAt?: [Date?, Date?];
      completeAt?: [Date?, Date?];
      createAt?: [Date?, Date?];
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {},
  ) {
    let query = this.taskQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }
    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where('user.id = :userId', { userId })
            .orWhere('space.access IS NOT NULL')
            .orWhere('task.access IS NOT NULL');
        }),
      );
    }

    if (options.roles) {
      for (const role of options.roles) {
        const userId = await this.userService.getUserId(role.user);
        const roleId = await this.roleService.getRoleId(role.role);
        query = query
          .andWhere('user.id = :userId', { userId })
          .andWhere('role.id = :roleId', { roleId });
      }
    }

    if (options.properties) {
      for (const prop of options.properties) {
        const property =
          prop.property instanceof Property
            ? prop.property
            : await this.propertyService.getProperty(prop.property);

        query = query.andWhere(
          `task.properties ->'$.prop${property.id}' LIKE CONCAT('%','${prop.value}','%')`,
        );
      }
    }

    if (options.superTask) {
      const superTaskId = await this.getTaskId(options.superTask);
      query = query.andWhere('superTask.id = :superTaskId', { superTaskId });
    }

    if (options.isRoot) {
      query = query.andWhere('task.superTask IS NULL');
    }

    if (options.name !== undefined) {
      query = query.andWhere('task.name LIKE :name', {
        name: `%${options.name}%`,
      });
    }

    if (options.state) {
      query = query.andWhere('task.state IN (:...states)', {
        states: unionArrays([options.state]),
      });
    }

    if (options.beginAt) {
      if (options.beginAt[0]) {
        const after = options.beginAt[0];
        query = query.andWhere('task.beginAt >= :after', { after });
      }
      if (options.beginAt[1]) {
        const before = options.beginAt[1];
        query = query.andWhere('task.beginAt < :before', { before });
      }
    }

    if (options.dueAt) {
      if (options.dueAt[0]) {
        const after = options.dueAt[0];
        query = query.andWhere('task.dueAt >= :after', { after });
      }
      if (options.dueAt[1]) {
        const before = options.dueAt[1];
        query = query.andWhere('task.dueAt < :before', { before });
      }
    }

    if (options.createAt) {
      if (options.createAt[0]) {
        const after = options.createAt[0];
        query = query.andWhere('task.createAt >= :after', { after });
      }
      if (options.createAt[1]) {
        const before = options.createAt[1];
        query = query.andWhere('task.createAt < :before', { before });
      }
    }

    if (options.completeAt) {
      if (options.completeAt[0]) {
        const after = options.completeAt[0];
        query = query.andWhere('task.completeAt >= :after', { after });
      }
      if (options.completeAt[1]) {
        const before = options.completeAt[1];
        query = query.andWhere('task.completeAt < :before', { before });
      }
    }

    query = query
      .leftJoinAndSelect('task.assignments', '_assignment')
      .leftJoinAndSelect('_assignment.users', '_user')
      .leftJoinAndSelect('_assignment.role', '_role');

    query = query.addOrderBy('task.priority', 'DESC');
    query = query.addOrderBy('task.id', 'DESC');

    if (!options.skip || !options.take) {
      query = query.skip((options.current - 1) * options.pageSize || 0).take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }
    query.printSql();
    return await query.getManyAndCount();
  }

  async getTaskId(task: Task | number) {
    return task instanceof Task ? task.id : task;
  }

  async getCommentId(comment: Comment | number) {
    return comment instanceof Comment ? comment.id : comment;
  }

  async changeTaskState(task: Task | number, state: TaskState, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (state === TaskState.COMPLETED) this.completeSubTask(task, executor);
    task.state = state;

    await this.manager.save(task);
    return await this.getTask(task.id);
  }

  async changeTask(
    task: Task | number,
    executor?: User | number,
    options: {
      priority?: number;
      properties?: any;
      name?: string;
      state?: TaskState;
      access?: AccessLevel;
      beginAt?: Date;
      dueAt?: Date;
    } = {},
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);

    if (options.name) task.name = options.name;
    if (options.priority !== undefined) task.priority = options.priority;
    if (options.properties !== undefined) task.properties = options.properties;
    if (options.access !== undefined) task.access = options.access;
    if (options.beginAt !== undefined) task.beginAt = options.beginAt;
    if (options.dueAt !== undefined) task.dueAt = options.dueAt;

    await this.manager.save(task);
    return await this.getTask(task.id);
  }

  async completeSubTask(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;
      await this.manager.save(subTask);
    }
  }

  async changeTaskContent(task: Task | number, content: OutputData, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');

    if (task.contents.length === 0) {
      const content = new Content();
      await this.manager.save(content);
      task.contents.push(content);
      await this.manager.save(task);
    }
    const lastContent = task.contents[task.contents.length - 1];
    lastContent.content = content;
    await this.manager.save(lastContent);
    return await this.getTask(task.id);
  }

  async commitOnTask(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden submittion.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.manager.save(task);
    // await this.addLog(task, LogAction.COMMIT, executor);
    return await this.getTask(task.id);
  }

  async refuseToCommit(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion, forbidden response.');

    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    // await this.addLog(task, LogAction.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new Content();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }

  async saveTaskContent(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task does not in progress, forbidden response.');

    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);

    if (task.contents.length > 0) {
      let cloneContent = new Content();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }
}
