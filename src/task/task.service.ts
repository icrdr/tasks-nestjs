import { Injectable } from '@nestjs/common';
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

  async getTask(identify: number) {
    return await this.manager.findOne(Task, identify, {
      relations: ['performers', 'requests'],
    });
  }

  async getTasks(options: { perPage: number; page: number }) {
    return await this.manager.findAndCount(Task, {
      take: options.perPage,
      skip: options.page,
      relations: ['performers', 'requests'],
    });
  }

  async startTask(task: Task | number) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    task.state = TaskState.IN_PROGRESS;
    return await this.manager.save(task);
  }

  async submitRequest(options: {
    task: Task | number;
    submitter: User | number | string;
    submitContent?: string;
  }) {
    const request = new PassRequest();
    const task =
      options.task instanceof Task
        ? options.task
        : await this.getTask(options.task);

    request.submitter =
      options.submitter instanceof User
        ? options.submitter
        : await this.userService.getUser(options.submitter);

    if (options.submitContent) request.submitContent = options.submitContent;

    await this.manager.save(request)
    task.requests.push(request);
    return await this.manager.save(task);
  }

  async createTask(options: {
    name: string;
    description?: string;
    performers?: User[] | number[] | string[];
  }) {
    const task = new Task();
    const performers = options.performers;

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

    task.name = options.name;
    if (options.description) task.description = options.description;

    return await this.manager.save(task);
  }
}
