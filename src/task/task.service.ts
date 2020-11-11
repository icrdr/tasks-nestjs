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

  async isUserThePerformer(task: Task | number, user: User | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    const userId = user instanceof User ? user.id : user;
    const performerIds = task.performers.map((item) => item.id);
    if (!performerIds.includes(userId))
      throw new ForbiddenException("You are not task's performer");
    return task;
  }

  async getTask(identify: number) {
    const task = await this.manager.findOne(Task, identify, {
      relations: ['performers', 'requests', 'subTasks'],
    });
    if (!task) throw new ForbiddenException('Task was not found.');
    return task;
  }

  async getTasks(options?: { perPage: number; page: number }) {
    return await this.manager.findAndCount(Task, {
      take: options.perPage,
      skip: options.page,
      relations: ['performers', 'requests', 'subTasks'],
    });
  }

  async startTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.SUSPENDED)
      throw new ForbiddenException('Task is not suspended.');
    task.state = TaskState.IN_PROGRESS;
    return await this.manager.save(task);
  }

  async completeTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    task.state = TaskState.COMPLETED;
    return await this.manager.save(task);
  }

  async submitRequest(
    task: Task | number,
    submitter: User | number | string,
    options?: {
      submitContent?: string;
    },
  ) {
    const request = new PassRequest();
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress.');

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
    options?: {
      responseContent?: string;
    },
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion.');

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

  async createTask(
    name: string,
    performers: User[] | number[] | string[],
    options?: {
      description?: string;
    },
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

    return await this.manager.save(task);
  }

  async createSubTask(
    task: Task | number,
    name: string,
    performers: User[] | number[] | string[],
    options?: {
      description?: string;
    },
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    const subTask = await this.createTask(name, performers, options);
    task.subTasks.push(subTask);
    return await this.manager.save(task);
  }
}
