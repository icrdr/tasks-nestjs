import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace } from '@server/user/user.decorator';
import { TaskService } from '../services/task.service';
import { AddTaskDTO, GetTasksDTO, TaskListRes, TaskMoreDetailRes } from '@dtos/task.dto';
import { ListResSerialize } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { unionArrays } from '@utils/utils';
import { SpaceService } from '../services/space.service';
import {
  AddSpaceDTO,
  ChangeSpaceDTO,
  GetSpacesDTO,
  SpaceDetailRes,
  SpaceListRes,
} from '@dtos/space.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { UserService } from '../../user/services/user.service';
import { AccessLevel } from '../../common/common.entity';
import { AssignmentService } from '../services/assignment.service';
import { RoleService } from '../services/role.service';

@Controller('api/spaces')
export class SpaceController {
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private userService: UserService,
    private assignmentService: AssignmentService,
    private roleService: RoleService,
  ) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id')
  async getSpace(@TargetSpace() space: Space, @CurrentUser() user: User) {
    const accessPriority = [AccessLevel.VIEW, AccessLevel.EDIT, AccessLevel.FULL];
    const userAccess = [accessPriority.indexOf(space.access)];
    const assignements = (await this.assignmentService.getAssignments({ space, user }))[0];

    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    const index = Math.max(...userAccess);
    space['userAccess'] = index >= 0 ? accessPriority[index] : null;
    return new SpaceDetailRes(space);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.change')
  @Put('/:id')
  async changeSpace(
    @TargetSpace() space: Space,
    @Body() body: ChangeSpaceDTO,
    @CurrentUser() user: User,
  ) {
    space = await this.spaceService.changeSpace(space, {
      name: body.name,
      access: body.access,
    });
    const accessPriority = [AccessLevel.VIEW, AccessLevel.EDIT, AccessLevel.FULL];
    const userAccess = [accessPriority.indexOf(space.access)];
    const assignements = (await this.assignmentService.getAssignments({ space, user }))[0];
    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    const index = Math.max(...userAccess);
    space['userAccess'] = index >= 0 ? accessPriority[index] : null;
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

  @Access('common.space.add')
  @Post()
  async addTeamSpace(@Body() body: AddSpaceDTO, @CurrentUser() user: User) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      admins: body.adminId ? unionArrays([...[body.adminId], user]) : [user],
      access: AccessLevel.VIEW,
    };
    const space = await this.spaceService.addSpace(body.name, user, options);
    space['userAccess'] = 'full';
    return new SpaceDetailRes(space);
  }
}
