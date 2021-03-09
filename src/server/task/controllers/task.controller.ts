import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace, TargetTask } from '@server/user/user.decorator';
import { TaskService } from '../services/task.service';
import {
  AddTaskDTO,
  GetTasksDTO,
  TaskListRes,
  TaskDetailRes,
  TaskMoreDetailRes,
  ChangeTaskDTO,
} from '@dtos/task.dto';
import { ListResSerialize } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { TaskAccessGuard } from '@server/user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { unionArrays } from '@utils/utils';
import { SpaceService } from '../services/space.service';
import { AccessLevel, TaskState } from '../../common/common.entity';
import { SpaceAccessGuard } from '../../user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { RoleService } from '../services/role.service';
import { UserService } from '../../user/services/user.service';
import { AssignmentService } from '../services/assignment.service';
import { MemberService } from '../services/member.service';
import { CommentService } from '../services/comment.service';
import { CommentListRes, GetCommentsDTO } from '@dtos/comment.dto';
import { PropertyService } from '../services/property.service';

@Controller('api/tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private commentService: CommentService,

    private assignmentService: AssignmentService,
  ) {}

  @UseGuards(TaskAccessGuard)
  @Access('common.task.add')
  @Post('/:id')
  async addSubTask(@TargetTask() task: Task, @Body() body: AddTaskDTO, @CurrentUser() user: User) {
    const options = {
      members: body.memberId ? unionArrays([...[body.memberId]]) : undefined,
      state: body.state,
    };
    return new TaskDetailRes(await this.taskService.addSubTask(task, body.name, user.id, options));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.view')
  @Get('/:id/comments')
  async getTaskComments(
    @TargetTask() task: Task,
    @Query() query: GetCommentsDTO,
    @CurrentUser() user: User,
  ) {
    const comments = await this.commentService.getComments({
      task: task,
      ...query,
    });
    return ListResSerialize(comments, CommentListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.view')
  @Get('/:id')
  async getTask(@TargetTask() task: Task, @CurrentUser() user: User) {
    return new TaskMoreDetailRes(task, user);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.remove')
  @Delete('/:id')
  async removeTask(@TargetTask() task: Task, @CurrentUser() user: User) {
    await this.taskService.removeTask(task);
    return { msg: 'ok' };
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
  @Access('common.task.change')
  @Put('/:id')
  async changeTask(
    @CurrentUser() user: User,
    @Body() body: ChangeTaskDTO,
    @TargetTask() task: Task,
  ) {
    return new TaskDetailRes(await this.taskService.changeTask(task, user, body));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/content')
  async saveTaskContent(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.saveTaskContent(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/start')
  async startTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.IN_PROGRESS, user),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/suspend')
  async suspendTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.SUSPENDED, user),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/complete')
  async completeTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.COMPLETED, user),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/restart')
  async restartTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(
      await this.taskService.changeTaskState(task, TaskState.IN_PROGRESS, user),
    );
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.edit')
  @Put('/:id/commit')
  async commitTask(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.commitOnTask(task, user));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.change')
  @Put('/:id/refuse')
  async acceptCommit(@CurrentUser() user: User, @TargetTask() task: Task) {
    return new TaskDetailRes(await this.taskService.refuseToCommit(task, user));
  }
}

@Controller('api/spaces')
export class SpaceTaskController {
  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private propertyService: PropertyService,
    private roleService: RoleService,
  ) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/tasks')
  async addSpaceTask(
    @Body() body: AddTaskDTO,
    @TargetSpace() space: Space,
    @CurrentUser() user: User,
  ) {
    const options = {
      state: body.state,
      admins: [user],
    };
    return new TaskMoreDetailRes(await this.taskService.addTask(space, body.name, user, options));
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
    const properties = [];
    for (const key in query) {
      const type = key.split(':')[0];
      switch (type) {
        case 'role':
          const role = await this.roleService.getRole(parseInt(key.split(':')[1]), true);
          const user = await this.userService.getUser(parseInt(query[key]), true);
          if (role && user) {
            roles.push({
              role,
              user,
            });
          }
          break;
        case 'prop':
          const property = await this.propertyService.getProperty(
            parseInt(key.split(':')[1]),
            true,
          );
          const value = query[key];
          properties.push({
            property,
            value,
          });
          break;
        default:
          break;
      }
    }

    const tasks = await this.taskService.getTasks({
      space,
      user,
      roles,
      properties,
      ...query,
    });
    return ListResSerialize(tasks, TaskListRes);
  }
}
