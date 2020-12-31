import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { GetTasksDTO } from '@dtos/task.dto';
import { isUserArray } from '@utils/typeGuard';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task, TaskContent, TaskState } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { ActionType, TaskLog } from '../entities/taskLog.entity';

@Injectable()
export class TaskService {
  constructor(private userService: UserService, private manager: EntityManager) {}

  async isUserThePerformer(
    task: Task | number,
    user: User | number,
    mandatoryCheck: boolean = true,
  ) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    const userId = user instanceof User ? user.id : user;
    let performerIdWhitelist = [];
    let parentTask = task.parentTask;

    while (parentTask) {
      parentTask = await this.getTask(parentTask.id); //fetch parentTask performer
      performerIdWhitelist = performerIdWhitelist.concat(
        parentTask.performers.map((item) => item.id),
      );
      parentTask = parentTask.parentTask;
    }

    if (!mandatoryCheck || !task.isMandatory) {
      performerIdWhitelist = performerIdWhitelist.concat(task.performers.map((item) => item.id));
    }
    if (!performerIdWhitelist.includes(userId))
      throw new ForbiddenException("You are not permitted task's performer");
    return task;
  }

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
      performers?: User[] | number[] | string[];
      description?: string;
      isMandatory?: boolean;
    } = {},
    executor?: User | number | string,
  ) {
    let task = new Task();

    if (options.performers) {
      if (!isUserArray(options.performers)) {
        let _performers: User[] = [];
        for (const identify of options.performers) {
          _performers.push((await this.userService.getUser(identify))!);
        }
        task.performers = _performers;
      } else {
        task.performers = options.performers;
      }
    }

    task.name = options.name || '';
    if (options.description) task.description = options.description;
    if (options.isMandatory) task.isMandatory = options.isMandatory;

    task = await this.manager.save(task)
    let content = new TaskContent();
    content.task = task
    content = await this.manager.save(content);

    await this.createTaskLog(task, ActionType.CREATE, executor);

    return await this.manager.save(task);
  }

  async getTask(identify: number) {
    const task = await this.manager.findOne(Task, identify, {
      relations: ['performers', 'contents', 'subTasks', 'parentTask', 'logs'],
    });
    if (!task) throw new ForbiddenException('Task was not found.');
    return task;
  }

  async getTasks(options: GetTasksDTO = {}) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.logs', 'log')
      .leftJoinAndSelect('task.performers', 'performer')
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
      .leftJoinAndSelect('task.performers', 'performer')
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
      .leftJoin('task.performers', 'performer')
      .where('performer.id = :id', { id: userId })
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

    await this.createTaskLog(task, ActionType.START, executor);

    return await this.manager.save(task);
  }

  async restartTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.COMPLETED)
      throw new ForbiddenException('Task is not completed, forbidden initialization.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;

    await this.createTaskLog(task, ActionType.RESTART, executor);

    return await this.manager.save(task);
  }

  async suspendTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.SUSPENDED;

    await this.createTaskLog(task, ActionType.SUSPEND, executor);

    return await this.manager.save(task);
  }

  async completeTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    this.completeSubTask(task, executor);
    task.state = TaskState.COMPLETED;

    await this.createTaskLog(task, ActionType.COMPLETE, executor);

    return await this.manager.save(task);
  }

  async completeSubTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    console.log(task.subTasks);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;

      await this.createTaskLog(subTask, ActionType.COMPLETE, executor);

      await this.manager.save(subTask);
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
    return await this.manager.save(task);
  }

  async commitOnTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden submittion.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.createTaskLog(task, ActionType.COMMIT, executor);
    return await this.manager.save(task);
  }

  async refuseToCommit(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion, forbidden response.');

    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.createTaskLog(task, ActionType.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new TaskContent();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.manager.save(task);
  }

  async createTaskLog(task: Task | number, action: ActionType, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    let taskLog = new TaskLog();
    if (executor)
      taskLog.executor =
        executor instanceof User ? executor : await this.userService.getUser(executor);

    taskLog.action = action;
    taskLog.task = task
    taskLog = await this.manager.save(taskLog);
    return await this.manager.save(task);
  }

  async createSubTask(
    task: Task | number,
    options: {
      name?: string;
      performers?: User[] | number[] | string[];
      description?: string;
      isMandatory?: boolean;
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
    return await this.manager.save(task);
  }
}
