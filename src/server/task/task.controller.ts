import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';

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
  TaskRes,
  TaskListRes,
  TaskDetailRes,
  UpdateTaskDTO,
} from '@dtos/task.dto';
import { IdDTO, ListResSerialize } from '@dtos/misc.dto';

@Controller('api/tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Perms('common.task.create')
  @Post()
  async createTask(@Body() body: CreateTaskDTO, @CurrentUser() currentUser: currentUser) {
    return new TaskRes(
      await this.taskService.createTask(body.name, body.performerId || [currentUser.id], {
        description: body.description,
      }),
    );
  }

  @Perms('common.task.browse')
  @Get('/:id')
  async getTask(@Param() params: IdDTO) {
    const task = await this.taskService.getTask(params.id);
    return new TaskDetailRes(task);
  }

  @Perms('common.task.browse')
  @Get()
  async getTasks(@Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getTasks(query);
    return ListResSerialize(tasks, TaskListRes);
  }

  @Perms('common.task.start')
  @Put('/:id/start')
  async startTask(@Param() params: IdDTO, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    return new TaskDetailRes(await this.taskService.startTask(task));
  }

  @Perms('common.task.suspend')
  @Put('/:id/suspend')
  async suspendTask(@Param() params: IdDTO, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    return new TaskDetailRes(await this.taskService.suspendTask(task));
  }

  @Perms('common.task.complete')
  @Put('/:id/complete')
  async completeTask(@Param() params: IdDTO, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id);
    return new TaskDetailRes(await this.taskService.completeTask(task));
  }

  @Perms('common.task.restart')
  @Put('/:id/restart')
  async restartTask(@Param() params: IdDTO, @CurrentUser() currentUser: currentUser) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id);
    return new TaskDetailRes(await this.taskService.restartTask(task));
  }

  @Perms('common.task.update')
  @Put('/:id/update')
  async updateTask(
    @Param() params: IdDTO,
    @Body() body: UpdateTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    return new TaskDetailRes(await this.taskService.updateTask(task, body.content));
  }

  @Perms('common.task.submitRequest')
  @Put('/:id/submit')
  async submitRequest(
    @Param() params: IdDTO,
    @Body() body: SubmitRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    return new TaskDetailRes(
      await this.taskService.submitRequest(task, currentUser.id, {
        submitContent: body.content,
      }),
    );
  }

  @Perms('common.task.respondRequest')
  @Put('/:id/respond')
  async respondRequest(
    @Param() params: IdDTO,
    @Body() body: RespondRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id);
    return new TaskDetailRes(
      await this.taskService.respondRequest(task, body.isConfirmed, currentUser.id, {
        responseContent: body.content,
      }),
    );
  }

  @Perms('common.task.create')
  @Post('/:id')
  async createSubTask(
    @Param() params: IdDTO,
    @Body() body: CreateSubTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    return new TaskRes(
      await this.taskService.createSubTask(task, body.name, body.performerId || [currentUser.id], {
        description: body.description,
        isMandatory: body.isMandatory,
      }),
    );
  }

  @Perms('common.task.browse')
  @Get('/:id/tasks')
  async getSubTasks(
    @Param() params: IdDTO,
    @Query() query: GetTasksDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
    const tasks = await this.taskService.getSubTasks(task, query);
    return ListResSerialize(tasks, TaskListRes);
  }
}
