import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { GetTasksDTO } from '@dtos/task.dto';
import { isUserArray } from '@utils/typeGuard';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task, Content, TaskState } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { Assignment, LogAction, Member, Space } from '../entities/space.entity';
import { unionArrays, unionEntityArrays } from '@utils/utils';
import { ConfigService } from '@nestjs/config';
import { SpaceService } from './space.service';

@Injectable()
export class TaskService {
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private configService: ConfigService,
    private manager: EntityManager,
  ) {}

  async checkParentTaskNotInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let superTask = task.superTask;
    if (superTask) {
      if (!states.includes(superTask.state))
        throw new ForbiddenException(`Parent task is restricted, forbidden action.`);
      this.checkParentTaskNotInStates(superTask, states);
    }
  }

  async createTask(
    space: Space | number,
    name: string,
    executor?: User | number | string,
    options: {
      state?: TaskState;
    } = {},
  ) {
    space = space instanceof Space ? space : await this.spaceService.getSpace(space);
    let task = new Task();
    task.space = space;
    task.name = name;
    if (options.state) task.state = options.state;
    task = await this.manager.save(task);
    //log
    return await this.getTask(task.id);
  }

  async createSubTask(
    task: Task | number,
    name: string,
    executor?: User | number | string,
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

    const subTask = await this.createTask(task.space, name, executor, options);
    subTask.superTask = task;
    await this.manager.save(subTask);
    // TODO: closure-table does not update when compounent'parent update yet. so we update it maunaly.
    // await this.manager.query(
    //   `UPDATE task_closure SET id_ancestor = ${task.id} WHERE id_descendant = ${subTask.id}`,
    // );
    return await this.getTask(task.id);
  }

  async getTaskAccess(task: Task | number, user: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    const taskId = task.id;
    const userId = await this.userService.getUserId(user);
    let query = this.manager
      .createQueryBuilder(Assignment, 'assignment')
      .leftJoinAndSelect('assignment.tasks', 'task')
      .leftJoinAndSelect('assignment.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('task.id = :taskId', { taskId })
      .andWhere('user.id = :userId', { userId });

    const assignments = await query.getMany();
    let access = this.configService.get('taskAccess')[task.access];
    assignments.forEach(
      (a) => (access = access.concat(this.configService.get('taskAccess')[a.role.access])),
    );
    return unionArrays(access);
  }

  async getTask(identify: number, exception = true) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.groups', 'group')
      .leftJoinAndSelect('group.members', 'gMember')
      .leftJoinAndSelect('gMember.user', 'gUser')
      .leftJoinAndSelect('group.task', 'gTask')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask')
      .leftJoinAndSelect('task.subTasks', 'subTask');
    query = query.where('task.id = :id', { id: identify });

    const task = await query.getOne();
    if (!task && exception) throw new NotFoundException('Task was not found.');

    return task;
  }

  async getTasks(
    options: {
      space?: Space | number;
      user?: User | number;
      superTask?: Task | number;
      state?: TaskState[];
      pageSize?: number;
      current?: number;
    } = {},
  ) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoin('task.space', 'space')
      .leftJoinAndSelect('task.assignments', 'assignment')
      .leftJoinAndSelect('assignment.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask');
    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }
    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query
        .andWhere('user.id = :userId', { userId })
        .orWhere('space.access IS NOT NULL')
        .orWhere('task.access IS NOT NULL');
    }
    if (options.superTask) {
      const superTaskId = await this.getTaskId(options.superTask);
      query = query.andWhere('superTask.id = :superTaskId', { superTaskId });
    }
    if (options.state) {
      query = query.andWhere('task.state IN (:...states)', {
        states: [...options.state],
      });
    }

    query = query
      .orderBy('task.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getTaskId(task: Task | number) {
    return task instanceof Task ? task.id : task;
  }

  async startTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.SUSPENDED)
      throw new ForbiddenException('Task is not suspended, forbidden initialization.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);

    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.START, executor);

    return await this.getTask(task.id);
  }

  async restartTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.COMPLETED)
      throw new ForbiddenException('Task is not completed, forbidden initialization.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.RESTART, executor);

    return await this.getTask(task.id);
  }

  async suspendTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.SUSPENDED;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.SUSPEND, executor);

    return await this.getTask(task.id);
  }

  async completeTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    this.completeSubTask(task, executor);
    task.state = TaskState.COMPLETED;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.COMPLETE, executor);

    return await this.getTask(task.id);
  }

  async completeSubTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;
      await this.manager.save(subTask);
      // await this.createLog(subTask, LogAction.COMPLETE, executor);
    }
  }

  async updateTaskContent(
    task: Task | number,
    content: OutputData,
    executor?: User | number | string,
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (task.contents.length === 0) {
      const content = new Content();
      await this.manager.save(content);
      task.contents.push(content);
    }
    const lastContent = task.contents[task.contents.length - 1];
    lastContent.content = content;
    await this.manager.save(lastContent);
    return await this.getTask(task.id);
  }

  async commitOnTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden submittion.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.COMMIT, executor);
    return await this.getTask(task.id);
  }

  async refuseToCommit(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion, forbidden response.');

    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    // await this.createLog(task, LogAction.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new Content();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }
}
