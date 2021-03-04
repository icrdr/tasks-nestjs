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
  AddAssignmentDTO,
  AddRoleDTO,
  AddSpaceDTO,
  AssignmentListRes,
  ChangeAssetDTO,
  ChangeRoleDTO,
  GetRolesDTO,
  GetSpacesDTO,
  MemberListRes,
  MemberRes,
  RoleListRes,
  RoleRes,
  SpaceDetailRes,
  SpaceListRes,
} from '@dtos/space.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { AccessLevel, Space } from '../entities/space.entity';
import { AssetService } from '../services/asset.service';
import { UserService } from '../../user/services/user.service';

@Controller('api/spaces')
export class SpaceController {
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private assetService: AssetService,
    private userService: UserService,
  ) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.add')
  @Post('/:id/tasks')
  async addSpaceTask(
    @Body() body: AddTaskDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
  ) {
    const options = {
      state: body.state,
      admins: [user],
      access: AccessLevel.VIEW,
    };
    return new TaskMoreDetailRes(await this.taskService.addTask(space, body.name, user, options));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.update')
  @Put('/:id/roles/:roleId')
  async changeRole(
    @CurrentUser() user: User,
    @Body() body: ChangeRoleDTO,
    @Param('roleId') roleId: number,
  ) {
    return new RoleRes(await this.spaceService.changeRole(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.update')
  @Put('/:id/assets/:assetId')
  async changeAsset(
    @CurrentUser() user: User,
    @Body() body: ChangeAssetDTO,
    @Param('assetId') roleId: number,
  ) {
    return new RoleRes(await this.assetService.changeAsset(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
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
  @Get('/:id/roles')
  async getSpaceRoles(
    @TargetSpace() space: Space,
    @Query() query: GetRolesDTO,
    @CurrentUser() user: User,
  ) {
    const roles = await this.spaceService.getRoles({
      space: space,
      ...query,
    });
    return ListResSerialize(roles, RoleListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Post('/:id/roles')
  async addSpaceRoles(
    @TargetSpace() space: Space,
    @Body() body: AddRoleDTO,
    @CurrentUser() user: User,
  ) {
    const role = await this.spaceService.addRole(space, body.name, body.access);
    return new RoleRes(role);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.view')
  @Get('/:id/assignments')
  async getSpaceAssignment(
    @TargetSpace() space: Space,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User,
  ) {
    const assignments = await this.spaceService.getAssignments({ space });
    return ListResSerialize(assignments, AssignmentListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.view')
  @Post('/:id/assignments')
  async addSpaceAssignment(
    @TargetSpace() space: Space,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User,
  ) {
    return await this.spaceService.addAssignment(
      space,
      body.userId,
      body.roleName,
      body.roleAccess,
    );
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.task.view')
  @Delete('/:id/assignments/:assignmentId')
  async removeSpaceAssignment(
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
    @Param('assignmentId') assignmentId: number,
  ) {
    await this.spaceService.removeAssignment(assignmentId);
    return { msg: 'ok' };
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/assets')
  async getSpaceAssets(
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
    const roles = [];
    for (const key in query) {
      const type = key.split(':')[0];
      if (type === 'role') {
        const role = await this.spaceService.getRole(parseInt(key.split(':')[1]), true);
        const user = await this.userService.getUser(parseInt(query[key]), true);
        if (role && user) {
          roles.push({
            role,
            user,
          });
        }
      }
    }
    const tasks = await this.taskService.getTasks({
      space,
      user,
      roles,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id')
  async getSpace(@TargetSpace() space: Space, @CurrentUser() user: User) {
    const accessPriority = [AccessLevel.FULL, AccessLevel.EDIT, AccessLevel.VIEW];
    const userAccess = [accessPriority.indexOf(space.access)];
    const assignements = (await this.spaceService.getAssignments({ space, user }))[0];
    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    space['userAccess'] = accessPriority[Math.min(...userAccess)];
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
