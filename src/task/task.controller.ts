import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { Request, Response } from 'express';
import { Perms } from 'src/user/perm.decorator';
import { PermGuard } from 'src/user/perm.guard';
import { UserService } from '../user/services/user.service';
import { CurrentUser } from '../user/user.decorator';
import { currentUser } from '../user/user.interface';
import { TaskState } from './task.entity';
import { TaskService } from './task.service';

class CreateTaskDTO {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}

class GetTasksDTO {
  @IsNumberString()
  @IsOptional()
  perPage: number;

  @IsNumberString()
  @IsOptional()
  page: number;
}

class SubmitRequestDTO {
  @IsString()
  @IsOptional()
  content: string;
}

@Controller('api/tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private userService: UserService,
  ) {}

  @Perms('common.task.create')
  @Post()
  async createTask(
    @Body() body: CreateTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    return this.taskService.createTask({
      name: body.name,
      description: body.description,
      performers: [currentUser.id],
    });
  }

  @Perms('common.task.browse')
  @Get('/:id')
  async getTask(@Param('id') id: number) {
    const task = await this.taskService.getTask(id);
    if (!task) throw new NotFoundException('Task was not found.');
    return task;
  }

  @Perms('common.task.browse')
  @Get()
  async getTasks(@Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getTasks({
      perPage: query.perPage || 5,
      page: query.page || 0,
    });
    return tasks;
  }

  @Perms('common.task.submitRequest')
  @Put('/:id/submit')
  async submitRequest(
    @Param('id') id: number,
    @Body() body: SubmitRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.getTask(id);
    if (!task) throw new NotFoundException('Task was not found.');

    const performerIds = task.performers.map((item) => item.id);
    if (!performerIds.includes(currentUser.id))
      throw new NotFoundException("You are not task's performer");
    if (task.state !== TaskState.IN_PROGRESS)
      throw new NotFoundException('Task is not in progress.');

    return await this.taskService.submitRequest({
      task: task,
      submitter: currentUser.id,
      submitContent: body.content,
    });
  }

  @Perms('common.task.start')
  @Put('/:id/start')
  async startTask(
    @Param('id') id: number,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.getTask(id);
    if (!task) throw new NotFoundException('Task was not found.');

    const performerIds = task.performers.map((item) => item.id);
    if (!performerIds.includes(currentUser.id))
      throw new NotFoundException("You are not task's performer");

    if (task.state !== TaskState.SUSPENDED)
      throw new NotFoundException('Task is not suspended.');

    return await this.taskService.startTask(task);
  }
}
