import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TypeGuardService } from '../common/typeGuard.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/services/user.service';
import { PassRequest, Task } from './task.entity';

@Injectable()
export class TaskService {
  constructor(
    private typeGuardService: TypeGuardService,
    private userService: UserService,
    private manager: EntityManager,
  ) {}

  async getTask(identify: number) {
    return await this.manager.findOne(Task, identify);
  }

  async getTasks(options: { perPage: number; page: number }) {
    return await this.manager.findAndCount(Task, {
      take: options.perPage,
      skip: options.page,
    });
  }

  async submitRequest(options: {
    task: Task | number;
    submitter: User | number | string;
    submitContent?: string;
  }) {
    const request = new PassRequest();

    await this.manager.save(request);
    return request;
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

    await this.manager.save(task);
    return task;
  }
}
