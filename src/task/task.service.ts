import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TypeGuardService } from '../common/typeGuard.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import { PassRequest, Task, TaskState } from './task.entity';

@Injectable()
export class TaskService {
  constructor(
    private typeGuardService: TypeGuardService,
    private userService: UserService,
    private manager: EntityManager,
  ) {}

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
      console.log(parentTask.performers.map((item) => item.id));
      parentTask = parentTask.parentTask;
    }

    if (!mandatoryCheck || !task.isMandatory) {
      performerIdWhitelist = performerIdWhitelist.concat(
        task.performers.map((item) => item.id),
      );
    }
    console.log(performerIdWhitelist);
    if (!performerIdWhitelist.includes(userId))
      throw new ForbiddenException("You are not permitted task's performer");
    return task;
  }

  async isParentTaskInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let parentTask = task.parentTask;
    if (parentTask) {
      if (!states.includes(parentTask.state))
        throw new ForbiddenException(
          `Parent task is restricted, forbidden action.`,
        );
      this.isParentTaskInStates(parentTask, states);
    }
  }

  async createTask(
    name: string,
    performers: User[] | number[] | string[],
    options: {
      description?: string;
      isMandatory?: boolean;
    } = {},
  ) {
    const task = new Task();

    if (performers) {
      if (!this.typeGuardService.isUserArray(performers)) {
        let _performers: User[] = [];
        for (const identify of performers) {
          _performers.push((await this.userService.getUser(identify))!);
        }
        task.performers = _performers;
      } else {
        task.performers = performers;
      }
    }

    task.name = name;
    if (options.description) task.description = options.description;
    if (options.isMandatory) task.isMandatory = options.isMandatory;

    return await this.manager.save(task);
  }

  async getTask(identify: number) {
    const task = await this.manager.findOne(Task, identify, {
      relations: ['performers', 'requests', 'subTasks', 'parentTask'],
    });
    if (!task) throw new ForbiddenException('Task was not found.');
    return task;
  }

  async getTasks(options: { perPage?: number; page?: number } = {}) {
    return await this.manager.findAndCount(Task, {
      take: options.perPage,
      skip: options.page,
      relations: ['performers', 'requests', 'subTasks', 'parentTask'],
    });
  }

  async startTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.SUSPENDED)
      throw new ForbiddenException(
        'Task is not suspended, forbidden initialization.',
      );
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    return await this.manager.save(task);
  }

  async suspendTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException(
        'Task is not in progress, forbidden suspension.',
      );
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.SUSPENDED;
    return await this.manager.save(task);
  }

  async completeTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.COMPLETED;
    return await this.manager.save(task);
  }

  async submitRequest(
    task: Task | number,
    submitter: User | number | string,
    options: {
      submitContent?: string;
    } = {},
  ) {
    const request = new PassRequest();
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException(
        'Task is not in progress, forbidden submittion.',
      );
    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    request.submitter =
      submitter instanceof User
        ? submitter
        : await this.userService.getUser(submitter);

    if (options.submitContent) request.submitContent = options.submitContent;

    await this.manager.save(request);
    task.state = TaskState.UNCONFIRMED;
    task.requests.push(request);
    return await this.manager.save(task);
  }

  async respondRequest(
    task: Task | number,
    isConfirmed: boolean,
    responder: User | number | string,
    options: {
      responseContent?: string;
    } = {},
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException(
        'Task does not wait for comfirmtion, forbidden response.',
      );

    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);
    const request = task.requests[task.requests.length - 1];
    request.responder =
      responder instanceof User
        ? responder
        : await this.userService.getUser(responder);

    if (options.responseContent)
      request.responseContent = options.responseContent;

    request.respondAt = new Date();
    await this.manager.save(request);

    task.state = isConfirmed ? TaskState.COMPLETED : TaskState.IN_PROGRESS;

    return await this.manager.save(task);
  }

  async createSubTask(
    task: Task | number,
    name: string,
    performers: User[] | number[] | string[],
    options: {
      description?: string;
      isMandatory?: boolean;
    } = {},
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (
      task.state === TaskState.UNCONFIRMED ||
      task.state === TaskState.COMPLETED
    )
      throw new ForbiddenException(
        'Task is freezed (completed or unconfirmed), \
        forbidden subtask creation.',
      );

    await this.isParentTaskInStates(task, [TaskState.IN_PROGRESS]);

    const subTask = await this.createTask(name, performers, options);
    task.subTasks.push(subTask);
    return await this.manager.save(task);
  }
}
