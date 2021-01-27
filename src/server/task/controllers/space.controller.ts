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
import { SpaceService } from '../services/space.service';
import { CreateSpaceDTO, SpaceDetailRes } from '@dtos/space.dto';

@Controller('api/spaces')
export class SpaceController {
  constructor(private taskService: TaskService, private spaceService: SpaceService) {}

  @Access('common.space.view')
  @Get('/:id/tasks')
  async getSpaceTasks(
    @Param() param: IdDTO,
    @Query() query: GetTasksDTO,
    @CurrentUser() user: User,
  ) {
    const tasks = await this.taskService.getTasks({
      space: param.id,
      user: user,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }

  @Access('common.space.create')
  @Post()
  async createSpace(@Body() body: CreateSpaceDTO, @CurrentUser() user: User) {
    return new SpaceDetailRes(await this.spaceService.createSpace(body.name, user));
  }
}
