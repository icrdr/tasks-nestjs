import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace, TargetTask } from '@server/user/user.decorator';
import { TaskService } from '../services/task.service';
import {
  AddTaskDTO,
  GetTasksDTO,
  TaskRes,
  TaskListRes,
  TaskDetailRes,
  TaskMoreDetailRes,
  AssetListRes,
  GetAssetsDTO,
  AddAssetDTO,
} from '@dtos/task.dto';
import { IdDTO, ListResSerialize, UserIdDTO } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { TaskAccessGuard } from '@server/user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { unionArrays } from '@utils/utils';
import { SpaceService } from '../services/space.service';
import {
  AddSpaceDTO,
  GetSpacesDTO,
  MemberListRes,
  MemberRes,
  SpaceDetailRes,
  SpaceListRes,
} from '@dtos/space.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { AccessLevel, Space } from '../entities/space.entity';
import { AssetService } from '../services/asset.service';

@Controller('api/spaces')
export class SpaceController {
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private assetService: AssetService,
  ) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.add')
  @Post('/:id/tasks')
  async addSpaceTask(
    @Body() body: AddTaskDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
  ) {
    const options = space.isPersonal
      ? {
          state: body.state,
          access: AccessLevel.FULL,
        }
      : {
          state: body.state,
          admins: [user],
          access: AccessLevel.VIEW,
        };
    return new TaskMoreDetailRes(
      await this.taskService.addTask(space, body.name, user, options),
    );
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.add')
  @Post('/:id/members/:userId')
  async addSpaceMember(
    @Param() param: UserIdDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
  ) {
    return new MemberRes(await this.spaceService.addMember(space, param.userId));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/members')
  async getSpaceMembers(@TargetSpace() space: Space, @Query() query: GetTasksDTO) {
    const members = await this.spaceService.getMembers({
      space: space,
      ...query,
    });
    return ListResSerialize(members, MemberListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/assets')
  async getTaskAssets(
    @TargetSpace() space: Space,
    @Query() query: GetAssetsDTO,
    @CurrentUser() user: User,
  ) {
    const assets = await this.assetService.getAssets({
      space: space,
      ...query,
    });
    return ListResSerialize(assets, AssetListRes);
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

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Post('/:id/assets')
  async addTaskAssets(
    @TargetSpace() space: Space,
    @Body() body: AddAssetDTO,
    @CurrentUser() user: User,
  ) {
    return await this.assetService.addAsset(body.name, body.source, {
      uploader: user,
      space: space,
      ...body,
    });
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Delete('/:id/assets/:assetId')
  async removeTaskAssets(
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
    @Param('assetId') assetId: number,
  ) {
    await this.assetService.removeAsset(assetId);
    return { msg: 'ok' };
  }

  @Access('common.space.add')
  @Post()
  async addTeamSpace(@Body() body: AddSpaceDTO, @CurrentUser() user: User) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      admins: body.adminId ? unionArrays([...[body.adminId], user]) : [user],
      access: AccessLevel.VIEW,
    };
    return new SpaceDetailRes(await this.spaceService.addSpace(body.name, user, options));
  }
}
