import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { GetTasksDTO } from '@dtos/task.dto';
import { isUserArray } from '@utils/typeGuard';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task, TaskContent, TaskState } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { ActionType, TaskLog } from '../entities/taskLog.entity';
import { Member } from '../entities/member.entity';

@Injectable()
export class TaskService {
  constructor(private userService: UserService, private manager: EntityManager) {}

  async isParentTaskInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let parentTask = task.parentTask;
    if (parentTask) {
      if (!states.includes(parentTask.state))
        throw new ForbiddenException(`Parent task is restricted, forbidden action.`);
      this.isParentTaskInStates(parentTask, states);
    }
  }

  async createTask(
    options: {
      name?: string;
      members?: User[] | number[] | string[];
    } = {},
    executor?: User | number | string,
  ) {
    let task = new Task();
    task.name = options.name || '';
    task = await this.manager.save(task);

    for (const member of options.members) {
      await this.createMember(task, member);
    }

    await this.createTaskLog(task, ActionType.CREATE, executor);
    return await this.getTask(task.id);
  }

  async createMember(task: Task | number, user: User | number | string, access: string[] = ['*']) {
    //check if task and user are exsited
    task = task instanceof Task ? task : await this.getTask(task, false);
    user = user instanceof User ? user : await this.userService.getUser(user, false);
    let member = await this.getMember(task.id, user.id, false);
    if (!task || !user || member) return;

    member = new Member();
    member.user = user;
    member.task = task;
    member.access = access;
    return await this.manager.save(member);
  }

  async getMember(taskIdentify: number, userIdentify: number | string, exception = true) {
    let query = this.manager
      .createQueryBuilder(Member, 'member')
      .leftJoinAndSelect('member.task', 'task')
      .leftJoinAndSelect('member.user', 'user')
      .where('task.id = :taskIdentify', { taskIdentify });

    query =
      typeof userIdentify === 'number'
        ? query.andWhere('user.id = :userIdentify', { userIdentify })
        : query.andWhere('user.username = :userIdentify', { userIdentify });

    const member = await query.getOne();
    if (!member && exception) throw new NotFoundException('Member was not found.');

    return member;
  }

  async getTask(identify: number, exception = true) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.logs', 'log')
      .leftJoinAndSelect('log.executor', 'executor')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.parentTask', 'parentTask');
    query = query.where('task.id = :id', { id: identify });

    const task = await query.getOne();
    if (!task && exception) throw new NotFoundException('Task was not found.');

    return task;
  }

  async getTasks(options: GetTasksDTO = {}) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.logs', 'log')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.parentTask', 'parentTask');
    if (options.state) {
      query = query.where('task.state IN (:...states)', {
        states: [...options.state],
      });
    }

    query = query
      .orderBy('task.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getSubTasks(parentTask: Task | number, options: GetTasksDTO = {}) {
    const parentTaskId = parentTask instanceof Task ? parentTask.id : parentTask;
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.parentTask', 'parentTask');
    if (options.state) {
      query = query.where('task.state IN (:...states)', {
        states: [...options.state],
      });
    }
    query = query.andWhere('parentTask.id =:id', { id: parentTaskId });
    query = query
      .orderBy('task.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getTasksOfUser(
    user: User | string | number,
    options: { pageSize?: number; current?: number } = {},
  ) {
    const userId = await this.userService.getUserId(user);

    return await this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoin('task.members', 'member')
      .where('member.id = :id', { id: userId })
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5)
      .getMany();
  }

  async startTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.SUSPENDED)
      throw new ForbiddenException('Task is not suspended, forbidden initialization.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);

    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.START, executor);

    return await this.getTask(task.id);
  }

  async restartTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.COMPLETED)
      throw new ForbiddenException('Task is not completed, forbidden initialization.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.RESTART, executor);

    return await this.getTask(task.id);
  }

  async suspendTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.SUSPENDED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.SUSPEND, executor);

    return await this.getTask(task.id);
  }

  async completeTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    this.completeSubTask(task, executor);
    task.state = TaskState.COMPLETED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.COMPLETE, executor);

    return await this.getTask(task.id);
  }

  async completeSubTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;
      await this.manager.save(subTask);
      await this.createTaskLog(subTask, ActionType.COMPLETE, executor);
    }
  }

  async updateTaskContent(
    task: Task | number,
    content: OutputData,
    executor?: User | number | string,
  ) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    if (task.contents.length === 0) {
      const content = new TaskContent();
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
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.COMMIT, executor);
    return await this.getTask(task.id);
  }

  async refuseToCommit(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion, forbidden response.');

    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new TaskContent();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }

  async createTaskLog(task: Task | number, action: ActionType, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task, false);
    let taskLog = new TaskLog();
    if (executor)
      taskLog.executor =
        executor instanceof User ? executor : await this.userService.getUser(executor, false);

    taskLog.action = action;
    taskLog.task = task;
    return await this.manager.save(taskLog);
  }

  async createSubTask(
    task: Task | number,
    options: {
      name?: string;
      members?: User[] | number[] | string[];
    } = {},
    executor?: User | number | string,
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state === TaskState.UNCONFIRMED || task.state === TaskState.COMPLETED)
      throw new ForbiddenException(
        'Task is freezed (completed or unconfirmed), \
        forbidden subtask creation.',
      );

    await this.isParentTaskInStates(task, [TaskState.SUSPENDED, TaskState.IN_PROGRESS]);

    const subTask = await this.createTask(options, executor);
    task.subTasks.push(subTask);
    await this.manager.save(task);
    return await this.getTask(task.id);
  }
}
