import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace, TargetTask } from '@server/user/user.decorator';
import { ListResSerialize } from '@dtos/misc.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { AssignmentService } from '../services/assignment.service';
import { RoleService } from '../services/role.service';
import { TaskAccessGuard } from '../../user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { User } from '../../user/entities/user.entity';
import { AddAssignmentDTO, AssignmentListRes } from '@dtos/assignment.dto';

@Controller('api/spaces')
export class SpaceAssignmentController {
  constructor(private assignmentService: AssignmentService, private roleService: RoleService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/assignments')
  async getSpaceAssignments(@TargetSpace() space: Space) {
    const assignments = await this.assignmentService.getAssignments({ space });
    return ListResSerialize(assignments, AssignmentListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/assignments')
  async addSpaceAssignment(@TargetSpace() space: Space, @Body() body: AddAssignmentDTO) {
    if (body.groupId) {
      const assignment = await this.assignmentService.getAssignment(body.groupId);
      return await this.assignmentService.appendAssignment(space, assignment);
    } else {
      const role = await this.roleService.getRoleByName(space, body.roleName);
      return await this.assignmentService.addAssignment(body.userId, role, {
        ...body,
        space,
      });
    }
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/assignments/:assignmentId')
  async removeSpaceAssignment(@Param('assignmentId') assignmentId: number) {
    await this.assignmentService.removeAssignment(assignmentId);
    return { msg: 'ok' };
  }
}

@Controller('api/tasks')
export class TaskAssignmentController {
  constructor(private assignmentService: AssignmentService, private roleService: RoleService) {}

  @UseGuards(TaskAccessGuard)
  @Access('common.task.remove')
  @Delete('/:id/assignments/:assignmentId')
  async removeTaskAssignment(
    @TargetTask() task: Task,
    @CurrentUser() user: User,
    @Param('assignmentId') assignmentId: number,
  ) {
    await this.assignmentService.removeAssignment(assignmentId);
    return { msg: 'ok' };
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.add')
  @Post('/:id/assignments')
  async addTaskAssignment(
    @TargetTask() task: Task,
    @Body() body: AddAssignmentDTO,
    @CurrentUser() user: User,
  ) {
    if (body.groupId) {
      const assignment = await this.assignmentService.getAssignment(body.groupId);
      return await this.assignmentService.appendAssignment(task, assignment);
    } else {
      const role = await this.roleService.getRoleByName(task.space, body.roleName);
      return await this.assignmentService.addAssignment(body.userId, role, { task });
    }
  }
}
