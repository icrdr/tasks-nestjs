import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { TargetSpace } from '@server/user/user.decorator';
import { ListResSerialize } from '@dtos/misc.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { RoleService } from '../services/role.service';
import { AddRoleDTO, ChangeRoleDTO, GetRolesDTO, RoleListRes, RoleRes } from '@dtos/role.dto';

@Controller('api/spaces')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.change')
  @Put('/:id/roles/:roleId')
  async changeSpaceRole(@Body() body: ChangeRoleDTO, @Param('roleId') roleId: number) {
    return new RoleRes(await this.roleService.changeRole(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/roles/:roleId')
  async removeSpaceRoles(@Param('roleId') roleId: number) {
    await this.roleService.removeRole(roleId);
    return { msg: 'ok' };
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/roles')
  async getSpaceRoles(@TargetSpace() space: Space, @Query() query: GetRolesDTO) {
    const roles = await this.roleService.getRoles({
      space: space,
      ...query,
    });
    return ListResSerialize(roles, RoleListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/roles')
  async addSpaceRole(@TargetSpace() space: Space, @Body() body: AddRoleDTO) {
    const role = await this.roleService.addRole(space, body.name, body.access);
    return new RoleRes(role);
  }
}
