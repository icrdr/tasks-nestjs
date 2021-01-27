import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetTask } from '@server/user/user.decorator';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDTO,
  GetTasksDTO,
  TaskRes,
  TaskListRes,
  TaskDetailRes,
  TaskMoreDetailRes,
} from '@dtos/task.dto';
import { IdDTO, ListResSerialize } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { TaskAccessGuard } from '@server/user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { unionArrays } from '@utils/utils';

@Controller('api/tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Access('common.task.create')
  @Post()
  async createTask(@Body() body: CreateTaskDTO, @CurrentUser() user: User) {
    const options = {
      state: body.state,
    };
    return new TaskMoreDetailRes(
      await this.taskService.createTask(body.spaceId, body.name, user, options),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.create')
  @Post('/:id')
  async createSubTask(
    @TargetTask() task: Task,
    @Body() body: CreateTaskDTO,
    @CurrentUser() user: User,
  ) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      state: body.state,
    };
    return new TaskDetailRes(
      await this.taskService.createSubTask(task, body.name, user.id, options),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.view')
  @Get('/:id')
  async getTask(@TargetTask() task: Task) {
    return new TaskMoreDetailRes(task);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.view')
  @Get('/:id/tasks')
  async getSubTasks(
    @TargetTask() task: Task,
    @Query() query: GetTasksDTO,
    @CurrentUser() user: User,
  ) {
    const tasks = await this.taskService.getTasks({
      superTask: task,
      user: user,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.update')
  @Put('/:id/start')
  async startTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.startTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.update')
  @Put('/:id/suspend')
  async suspendTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.suspendTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.update')
  @Put('/:id/complete')
  async completeTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.completeTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.update')
  @Put('/:id/restart')
  async restartTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.restartTask(task, user));
  }

  // @Perms('common.task.update')
  // @Put('/:id/update')
  // async updateTask(
  //   @Param() params: IdDTO,
  //   @Body() body: UpdateTaskDTO,
  //   @CurrentUser() currentUser: currentUser,
  // ) {
  //   const task = await this.taskService.isUserThePerformer(params.id, currentUser.id, false);
  //   return new TaskDetailRes(await this.taskService.updateTask(task, body.content, currentUser.id));
  // }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.edit')
  @Put('/:id/commit')
  async commitTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.commitOnTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.update')
  @Put('/:id/refuse')
  async acceptCommit(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.refuseToCommit(task, user));
  }
}
