import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { TargetSpace } from '@server/user/user.decorator';
import { ListResSerialize } from '@dtos/misc.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { AssignmentService } from '../services/assignment.service';
import {
  AddAssignmentDTO,
  AssignmentListRes,
  AssignmentRes,
  ChangeAssignmentDTO,
} from '@dtos/assignment.dto';

@Controller('api/spaces')
export class GroupController {
  constructor(private assignmentService: AssignmentService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/groups')
  async getSpaceGroups(@TargetSpace() space: Space) {
    const assignments = await this.assignmentService.getAssignments({ root: space });
    return ListResSerialize(assignments, AssignmentListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/groups')
  async addSpaceGroup(@TargetSpace() space: Space, @Body() body: AddAssignmentDTO) {
    const assignment = await this.assignmentService.addAssignment([], space.roles[0], {
      name: body.name,
      root: space,
    });
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.change')
  @Put('/:id/groups/:groupId')
  async changeSpaceGroup(@Param('groupId') groupId: number, @Body() body: ChangeAssignmentDTO) {
    const assignment = await this.assignmentService.changeAssignment(groupId, {
      name: body.name,
      role: body.roleId,
    });
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/groups/:groupId/members/:userId')
  async addSpaceGroupMember(@Param('groupId') groupId: number, @Param('userId') userId: number) {
    const assignment = await this.assignmentService.addAssignmentMember(groupId, userId);
    return new AssignmentRes(assignment);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/groups/:groupId')
  async removeSpaceGroup(@Param('groupId') groupId: number) {
    await this.assignmentService.removeAssignment(groupId);
    return { msg: 'ok' };
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/groups/:groupId/members/:userId')
  async removeSpaceGroupMember(@Param('groupId') groupId: number, @Param('userId') userId: number) {
    const assignment = await this.assignmentService.removeAssignmentMember(groupId, userId);
    return new AssignmentRes(assignment);
  }
}
