import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { TargetSpace } from '@server/user/user.decorator';
import { GetTasksDTO } from '@dtos/task.dto';
import { ListResSerialize, UserIdDTO } from '@dtos/misc.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { MemberService } from '../services/member.service';
import { MemberListRes, MemberRes } from '@dtos/member.dto';

@Controller('api/spaces')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/members/:userId')
  async addSpaceMember(@Param() param: UserIdDTO, @TargetSpace() space: Space) {
    return new MemberRes(await this.memberService.addMember(space, param.userId));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/members')
  async getSpaceMembers(@TargetSpace() space: Space, @Query() query: GetTasksDTO) {
    const members = await this.memberService.getMembers({
      space: space,
      ...query,
    });
    return ListResSerialize(members, MemberListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/members/:userId')
  async removeSpaceMember(@TargetSpace() space: Space, @Param('userId') userId: number) {
    await this.memberService.removeMember(space, userId);
    return { msg: 'ok' };
  }
}
