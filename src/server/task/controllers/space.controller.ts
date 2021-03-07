import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Access } from "@server/user/access.decorator";
import {
  CurrentUser,
  TargetSpace,
  TargetTask,
} from "@server/user/user.decorator";
import { TaskService } from "../services/task.service";
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
} from "@dtos/task.dto";
import { IdDTO, ListResSerialize, UserIdDTO } from "@dtos/misc.dto";
import { User } from "@server/user/entities/user.entity";
import { TaskAccessGuard } from "@server/user/taskAccess.guard";
import { Task } from "../entities/task.entity";
import { unionArrays } from "@utils/utils";
import { SpaceService } from "../services/space.service";
import {
  AddAssignmentDTO,
  AddRoleDTO,
  AddSpaceDTO,
  AssignmentListRes,
  AssignmentRes,
  ChangeAssetDTO,
  ChangeAssignmentDTO,
  ChangeRoleDTO,
  ChangeSpaceDTO,
  GetAssignmentDTO,
  GetRolesDTO,
  GetSpacesDTO,
  MemberListRes,
  MemberRes,
  RoleListRes,
  RoleRes,
  SpaceDetailRes,
  SpaceListRes,
} from "@dtos/space.dto";
import { SpaceAccessGuard } from "@server/user/spaceAccess.guard";
import { Space } from "../entities/space.entity";
import { AssetService } from "../services/asset.service";
import { UserService } from "../../user/services/user.service";
import { AccessLevel } from "../../common/common.entity";

@Controller("api/spaces")
export class SpaceController {
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private assetService: AssetService,
    private userService: UserService
  ) {}

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/tasks")
  async addSpaceTask(
    @Body() body: AddTaskDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User
  ) {
    const options = {
      state: body.state,
      admins: [user],
    };
    return new TaskMoreDetailRes(
      await this.taskService.addTask(space, body.name, user, options)
    );
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.change")
  @Put("/:id/roles/:roleId")
  async changeRole(
    @CurrentUser() user: User,
    @Body() body: ChangeRoleDTO,
    @Param("roleId") roleId: number
  ) {
    return new RoleRes(await this.spaceService.changeRole(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.change")
  @Put("/:id/assets/:assetId")
  async changeAsset(
    @CurrentUser() user: User,
    @Body() body: ChangeAssetDTO,
    @Param("assetId") roleId: number
  ) {
    return new RoleRes(await this.assetService.changeAsset(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/members/:userId")
  async addSpaceMember(
    @Param() param: UserIdDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User
  ) {
    return new MemberRes(
      await this.spaceService.addMember(space, param.userId)
    );
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/members")
  async getSpaceMembers(
    @TargetSpace() space: Space,
    @Query() query: GetTasksDTO
  ) {
    const members = await this.spaceService.getMembers({
      space: space,
      ...query,
    });
    return ListResSerialize(members, MemberListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/roles")
  async getSpaceRoles(
    @TargetSpace() space: Space,
    @Query() query: GetRolesDTO,
    @CurrentUser() user: User
  ) {
    const roles = await this.spaceService.getRoles({
      space: space,
      ...query,
    });
    return ListResSerialize(roles, RoleListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/roles")
  async addSpaceRoles(
    @TargetSpace() space: Space,
    @Body() body: AddRoleDTO,
    @CurrentUser() user: User
  ) {
    const role = await this.spaceService.addRole(space, body.name, body.access);
    return new RoleRes(role);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/groups")
  async getSpaceGroups(
    @TargetSpace() space: Space,
    @Body() body: GetAssignmentDTO,
    @CurrentUser() user: User
  ) {
    const assignments = await this.spaceService.getAssignments({ root: space });
    return ListResSerialize(assignments, AssignmentListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/groups")
  async addSpaceGroup(
    @TargetSpace() space: Space,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User
  ) {
    const assignment = await this.spaceService.addAssignment(
      [],
      space.roles[0],
      {
        name: body.name,
        root: space,
      }
    );
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.change")
  @Put("/:id/groups/:groupId")
  async changeSpaceGroup(
    @TargetSpace() space: Space,
    @Param("groupId") groupId: number,
    @Body() body: ChangeAssignmentDTO,
    @CurrentUser() user: User
  ) {
    const assignment = await this.spaceService.changeAssignment(groupId, {
      name: body.name,
      role: body.roleId,
    });
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/groups/:groupId/members/:userId")
  async addSpaceGroupMember(
    @TargetSpace() space: Space,
    @Param("groupId") groupId: number,
    @Param("userId") userId: number,
    @CurrentUser() user: User
  ) {
    const assignment = await this.spaceService.addAssignmentMember(
      groupId,
      userId
    );
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.delete")
  @Delete("/:id/members/:userId")
  async removeSpaceMember(
    @TargetSpace() space: Space,
    @Param("userId") userId: number,
    @CurrentUser() user: User
  ) {
    await this.spaceService.removeMember(space, userId);
    return {msg:'ok'};
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.delete")
  @Delete("/:id/groups/:groupId/members/:userId")
  async removeSpaceGroupMember(
    @TargetSpace() space: Space,
    @Param("groupId") groupId: number,
    @Param("userId") userId: number,
    @CurrentUser() user: User
  ) {
    const assignment = await this.spaceService.removeAssignmentMember(
      groupId,
      userId
    );
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/assignments")
  async getSpaceAssignments(
    @TargetSpace() space: Space,
    @Body() body: GetAssignmentDTO,
    @CurrentUser() user: User
  ) {
    const assignments = await this.spaceService.getAssignments({ space });
    return ListResSerialize(assignments, AssignmentListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/assignments")
  async addSpaceAssignment(
    @TargetSpace() space: Space,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User
  ) {
    if (body.groupId) {
      const assignment = await this.spaceService.getAssignment(body.groupId);
      return await this.spaceService.appendAssignment(space, assignment);
    } else {
      const role = await this.spaceService.getRoleByName(space, body.roleName);
      return await this.spaceService.addAssignment(body.userId, role, {
        ...body,
        space,
      });
    }
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.delete")
  @Delete("/:id/assignments/:assignmentId")
  async removeSpaceAssignment(
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
    @Param("assignmentId") assignmentId: number
  ) {
    await this.spaceService.removeAssignment(space, assignmentId);
    return { msg: "ok" };
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/assets")
  async getSpaceAssets(
    @TargetSpace() space: Space,
    @Query() query: GetAssetsDTO,
    @CurrentUser() user: User
  ) {
    const assets = await this.assetService.getAssets({
      space: space,
      ...query,
    });
    return ListResSerialize(assets, AssetListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.view")
  @Get("/:id/tasks")
  async getSpaceTasks(
    @TargetSpace() space: Space,
    @Query() query: GetTasksDTO,
    @CurrentUser() user: User
  ) {
    const roles = [];
    for (const key in query) {
      const type = key.split(":")[0];
      if (type === "role") {
        const role = await this.spaceService.getRole(
          parseInt(key.split(":")[1]),
          true
        );
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
  @Access("common.space.view")
  @Get("/:id")
  async getSpace(@TargetSpace() space: Space, @CurrentUser() user: User) {
    const accessPriority = [
      AccessLevel.VIEW,
      AccessLevel.EDIT,
      AccessLevel.FULL,
    ];
    const userAccess = [accessPriority.indexOf(space.access)];
    const assignements = (
      await this.spaceService.getAssignments({ space, user })
    )[0];

    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    const index = Math.max(...userAccess);
    space["userAccess"] = index >= 0 ? accessPriority[index] : null;
    return new SpaceDetailRes(space);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.change")
  @Put("/:id")
  async changeSpace(
    @TargetSpace() space: Space,
    @Body() body: ChangeSpaceDTO,
    @CurrentUser() user: User
  ) {
    space = await this.spaceService.changeSpace(space, {
      name: body.name,
      access: body.access,
    });
    const accessPriority = [
      AccessLevel.VIEW,
      AccessLevel.EDIT,
      AccessLevel.FULL,
    ];
    const userAccess = [accessPriority.indexOf(space.access)];
    const assignements = (
      await this.spaceService.getAssignments({ space, user })
    )[0];
    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    const index = Math.max(...userAccess);
    space["userAccess"] = index >= 0 ? accessPriority[index] : null;
    return new SpaceDetailRes(space);
  }

  @Access("common.space.view")
  @Get()
  async getSpaces(@Query() query: GetSpacesDTO, @CurrentUser() user: User) {
    const spaces = await this.spaceService.getSpaces({
      user: user,
      ...query,
    });
    return ListResSerialize(spaces, SpaceListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.add")
  @Post("/:id/assets")
  async addTaskAssets(
    @TargetSpace() space: Space,
    @Body() body: AddAssetDTO,
    @CurrentUser() user: User
  ) {
    return await this.assetService.addAsset(body.name, body.source, {
      uploader: user,
      space: space,
      ...body,
    });
  }

  @UseGuards(SpaceAccessGuard)
  @Access("common.space.delete")
  @Delete("/:id/assets/:assetId")
  async removeTaskAssets(
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
    @Param("assetId") assetId: number
  ) {
    await this.assetService.deleteAsset(assetId);
    return { msg: "ok" };
  }

  @Access("common.space.add")
  @Post()
  async addTeamSpace(@Body() body: AddSpaceDTO, @CurrentUser() user: User) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      admins: body.adminId ? unionArrays([...[body.adminId], user]) : [user],
      access: AccessLevel.VIEW,
    };
    const space = await this.spaceService.addSpace(body.name, user, options);
    space["userAccess"] = "full";
    return new SpaceDetailRes(space);
  }
}
