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
import { CurrentUser, TargetTask } from "@server/user/user.decorator";
import { TaskService } from "../services/task.service";
import {
  AddTaskDTO,
  GetTasksDTO,
  TaskRes,
  TaskListRes,
  TaskDetailRes,
  TaskMoreDetailRes,
  GetCommentsDTO,
  CommentListRes,
  AssetListRes,
  AddAssetDTO,
  GetAssetsDTO,
  ChangeTaskDTO,
} from "@dtos/task.dto";
import { IdDTO, ListResSerialize } from "@dtos/misc.dto";
import { User } from "@server/user/entities/user.entity";
import { TaskAccessGuard } from "@server/user/taskAccess.guard";
import { Task } from "../entities/task.entity";
import { unionArrays } from "@utils/utils";
import { AssetService } from "../services/asset.service";
import { SpaceService } from "../services/space.service";
import { AddAssignmentDTO } from "@dtos/space.dto";
import { AccessLevel, TaskState } from "../../common/common.entity";

@Controller("api/tasks")
export class TaskController {
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private assetService: AssetService
  ) {}

  @UseGuards(TaskAccessGuard)
  @Access("common.task.add")
  @Post("/:id")
  async addSubTask(
    @TargetTask() task: Task,
    @Body() body: AddTaskDTO,
    @CurrentUser() user: User
  ) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      state: body.state,
    };
    return new TaskDetailRes(
      await this.taskService.addSubTask(task, body.name, user.id, options)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.view")
  @Get("/:id/comments")
  async getTaskComments(
    @TargetTask() task: Task,
    @Query() query: GetCommentsDTO,
    @CurrentUser() user: User
  ) {
    const comments = await this.taskService.getComments({
      task: task,
      ...query,
    });
    return ListResSerialize(comments, CommentListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.add")
  @Post("/:id/assets")
  async addTaskAssets(
    @TargetTask() task: Task,
    @Body() body: AddAssetDTO,
    @CurrentUser() user: User
  ) {
    return await this.assetService.addAsset(body.name, body.source, {
      uploader: user,
      task: task,
      ...body,
    });
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.view")
  @Get("/:id/assets")
  async getTaskAssets(
    @TargetTask() task: Task,
    @Query() query: GetAssetsDTO,
    @CurrentUser() user: User
  ) {
    const assets = await this.assetService.getAssets({
      task: task,
      ...query,
    });
    return ListResSerialize(assets, AssetListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.remove")
  @Delete("/:id/assets/:assetId")
  async removeTaskAsset(
    @TargetTask() task: Task,
    @CurrentUser() user: User,
    @Param("assetId") assetId: number
  ) {
    await this.assetService.deleteAsset(assetId);
    return { msg: "ok" };
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.remove")
  @Delete("/:id/assignments/:assignmentId")
  async removeTaskAssignment(
    @TargetTask() task: Task,
    @CurrentUser() user: User,
    @Param("assignmentId") assignmentId: number
  ) {
    await this.spaceService.removeAssignment(task, assignmentId);
    return { msg: "ok" };
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.add")
  @Post("/:id/assignments")
  async addTaskAssignment(
    @TargetTask() task: Task,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User
  ) {
    if (body.groupId) {
      const assignment = await this.spaceService.getAssignment(body.groupId);
      return await this.spaceService.appendAssignment(task, assignment);
    } else {
      const role = await this.spaceService.getRoleByName(
        task.space,
        body.roleName
      );
      return await this.spaceService.addAssignment(body.userId, role, { task });
    }
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.view")
  @Get("/:id")
  async getTask(@TargetTask() task: Task, @CurrentUser() user: User) {
    const accessPriority = [
      AccessLevel.VIEW,
      AccessLevel.EDIT,
      AccessLevel.FULL,
    ];
    const userAccess = [accessPriority.indexOf(task.access)];
    const assignements = (
      await this.spaceService.getAssignments({ task, user })
    )[0];
    for (const assignement of assignements) {
      userAccess.push(accessPriority.indexOf(assignement.role.access));
    }
    const index = Math.max(...userAccess);
    task["userAccess"] = index >= 0 ? accessPriority[index] : null;
    return new TaskMoreDetailRes(task);
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.remove")
  @Delete("/:id")
  async removeTask(@TargetTask() task: Task, @CurrentUser() user: User) {
    await this.taskService.removeTask(task);
    return { msg: "ok" };
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.view")
  @Get("/:id/tasks")
  async getSubTasks(
    @TargetTask() task: Task,
    @Query() query: GetTasksDTO,
    @CurrentUser() user: User
  ) {
    const tasks = await this.taskService.getTasks({
      superTask: task,
      user: user,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id")
  async changeTask(
    @CurrentUser() user: User,
    @Body() body: ChangeTaskDTO,
    @TargetTask() task: Task
  ) {
    return new TaskDetailRes(
      await this.taskService.changeTask(task, user, body)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id/start")
  async startTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.IN_PROGRESS, user)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id/suspend")
  async suspendTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.SUSPENDED, user)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id/complete")
  async completeTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.COMPLETED, user)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id/restart")
  async restartTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.IN_PROGRESS, user)
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.edit")
  @Put("/:id/commit")
  async commitTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.commitOnTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access("common.task.change")
  @Put("/:id/refuse")
  async acceptCommit(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.refuseToCommit(task, user));
  }
}
