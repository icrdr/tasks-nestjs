import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

import { Perms } from '../user/perm.decorator';
import { UserService } from '../user/services/user.service';
import { CurrentUser } from '../user/user.decorator';
import { currentUser } from '../user/user.interface';
import { TaskService } from './task.service';
import {
  CreateTaskDTO,
  GetTasksDTO,
  SubmitRequestDTO,
  RespondRequestDTO,
  CreateSubTaskDTO,
} from '@/dtos/task.dto';

@Controller('api/tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Perms('common.task.create')
  @Post()
  async createTask(@Body() body: CreateTaskDTO, @CurrentUser() currentUser: currentUser) {
    return this.taskService.createTask(body.name, [currentUser.id], {
      description: body.description,
    });
  }

  @Perms('common.task.browse')
  @Get('/:id')
  async getTask(@Param('id') id: number) {
    const task = await this.taskService.getTask(id);
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

  @Perms('common.task.start')
  @Put('/:id/start')
  async startTask(@Param('id') id: number, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id, false);
    return await this.taskService.startTask(task);
  }

  @Perms('common.task.suspend')
  @Put('/:id/suspend')
  async suspendTask(@Param('id') id: number, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id, false);
    return await this.taskService.suspendTask(task);
  }

  @Perms('common.task.complete')
  @Put('/:id/complete')
  async completeTask(@Param('id') id: number, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.completeTask(task);
  }

  @Perms('common.task.submitRequest')
  @Put('/:id/submit')
  async submitRequest(
    @Param('id') id: number,
    @Body() body: SubmitRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id, false);
    return await this.taskService.submitRequest(task, currentUser.id, {
      submitContent: body.content,
    });
  }

  @Perms('common.task.respondRequest')
  @Put('/:id/respond')
  async respondRequest(
    @Param('id') id: number,
    @Body() body: RespondRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.respondRequest(
      task,
      body.isConfirmed === 'true', //default is false
      currentUser.id,
      { responseContent: body.content },
    );
  }

  @Perms('common.task.create')
  @Post('/:id')
  async createSubTask(
    @Param('id') id: number,
    @Body() body: CreateSubTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id, false);
    const subTaskPerformerId = body.userId ? body.userId : currentUser.id;
    return this.taskService.createSubTask(task, body.name, [subTaskPerformerId], {
      description: body.description,
      isMandatory: !(body.isMandatory === 'false'), //default is true
    });
  }
}
