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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Access } from '@server/user/access.decorator';
import { UserService } from '@server/user/services/user.service';
import { CurrentUser, TargetTask } from '@server/user/user.decorator';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDTO,
  GetTasksDTO,
  ReviewTaskDTO,
  CreateSubTaskDTO,
  TaskRes,
  TaskListRes,
  TaskDetailRes,
  UpdateTaskDTO,
  MemberRes,
  TaskMoreDetailRes,
} from '@dtos/task.dto';
import { IdDTO, ListResSerialize } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { TaskAccessGuard } from '../../user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { unionArrays } from '../../../utils/utils';

@Controller('api/tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Access('common.task.create')
  @Post()
  async createTask(@Body() body: CreateTaskDTO, @CurrentUser() user: User) {
    const options = {
      name: body.name,
      members: body.memberId ? unionArrays([...body.memberId, user.id]) : [user.id],
    };
    return new TaskMoreDetailRes(await this.taskService.createTask(options, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
  @Get('/:id')
  async getTask(@TargetTask() task: Task) {
    return new TaskMoreDetailRes(await this.taskService.getTask(task.id));
  }

  @Access('common.task.browse')
  @Get()
  async getTasks(@Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getTasks(query);
    return ListResSerialize(tasks, TaskListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.start')
  @Put('/:id/start')
  async startTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.startTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.suspend')
  @Put('/:id/suspend')
  async suspendTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.suspendTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
  @Put('/:id/complete')
  async completeTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.completeTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
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
  @Access('common.task.browse')
  @Put('/:id/commit')
  async commitTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.commitOnTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
  @Put('/:id/refuse')
  async acceptCommit(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.refuseToCommit(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
  @Post('/:id')
  async createSubTask(
    @TargetTask() task: Task,
    @Body() body: CreateSubTaskDTO,
    @CurrentUser() currentUser: User,
  ) {
    return new TaskRes(
      await this.taskService.createSubTask(
        task,
        {
          name: body.name,
          members: body.memberId || [currentUser.id],
        },
        currentUser.id,
      ),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.browse')
  @Get('/:id/tasks')
  async getSubTasks(@TargetTask() task: Task, @Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getSubTasks(task, query);
    return ListResSerialize(tasks, TaskListRes);
  }
}
