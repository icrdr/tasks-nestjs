import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace, TargetTask } from '@server/user/user.decorator';
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
import { CreateSpaceDTO, GetSpacesDTO, MemberListRes, SpaceDetailRes, SpaceListRes } from '@dtos/space.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { accessLevel, Space } from '../entities/space.entity';

@Controller('api/spaces')
export class SpaceController {
  constructor(private taskService: TaskService, private spaceService: SpaceService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.create')
  @Post('/:id/tasks')
  async createSpaceTask(
    @Body() body: CreateTaskDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
  ) {
    const options = space.isPersonal
      ? {
          state: body.state,
          access: accessLevel.FULL,
        }
      : {
          state: body.state,
          admins: [user],
          access: accessLevel.VIEW,
        };
    return new TaskMoreDetailRes(
      await this.taskService.createTask(space, body.name, user, options),
    );
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/members')
  async getSpaceMembers(
    @TargetSpace() space: Space,
    @Query() query: GetTasksDTO,
  ) {
    const members = await this.spaceService.getMembers({
      space: space,
      ...query,
    });
    return ListResSerialize(members, MemberListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/tasks')
  async getSpaceTasks(
    @TargetSpace() space: Space,
    @Query() query: GetTasksDTO,
    @CurrentUser() user: User,
  ) {
    const tasks = await this.taskService.getTasks({
      space: space,
      user: user,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id')
  async getSpace(@TargetSpace() space: Space) {
    return new SpaceDetailRes(space);
  }

  @Access('common.space.view')
  @Get()
  async getSpaces(@Query() query: GetSpacesDTO, @CurrentUser() user: User) {
    const spaces = await this.spaceService.getSpaces({
      user: user,
      ...query,
    });
    return ListResSerialize(spaces, SpaceListRes);
  }

  @Access('common.space.create')
  @Post()
  async createTeamSpace(@Body() body: CreateSpaceDTO, @CurrentUser() user: User) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      admins: body.adminId ? unionArrays([...[body.adminId], user]) : [user],
      access: accessLevel.VIEW,
    };
    return new SpaceDetailRes(await this.spaceService.createSpace(body.name, user, options));
  }
}
