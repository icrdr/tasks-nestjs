import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { CurrentUser, TargetSpace, TargetTask } from '@server/user/user.decorator';
import { ListResSerialize } from '@dtos/misc.dto';
import { User } from '@server/user/entities/user.entity';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { AssetService } from '../services/asset.service';
import { TaskAccessGuard } from '../../user/taskAccess.guard';
import { Task } from '../entities/task.entity';
import { AddAssetDTO, AssetListRes, AssetRes, ChangeAssetDTO, GetAssetsDTO } from '@dtos/asset.dto';
import { PropertyService } from '../services/property.service';

@Controller('api/spaces')
export class SpaceAssetController {
  constructor(private assetService: AssetService, private propertyService: PropertyService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.change')
  @Put('/:id/assets/:assetId')
  async changeAsset(@Body() body: ChangeAssetDTO, @Param('assetId') roleId: number) {
    return new AssetRes(await this.assetService.changeAsset(roleId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/assets')
  async getSpaceAssets(@TargetSpace() space: Space, @Query() query: GetAssetsDTO) {
    const properties = [];
    for (const key in query) {
      const type = key.split(':')[0];
      if (type === 'prop') {
        const property = await this.propertyService.getProperty(parseInt(key.split(':')[1]), true);
        const value = query[key];
        properties.push({
          property,
          value,
        });
      }
    }

    const assets = await this.assetService.getAssets({
      space,
      properties,
      ...query,
    });
    return ListResSerialize(assets, AssetListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
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
  @Access('common.space.delete')
  @Delete('/:id/assets/:assetId')
  async removeTaskAssets(@Param('assetId') assetId: number) {
    await this.assetService.deleteAsset(assetId);
    return { msg: 'ok' };
  }
}

@Controller('api/tasks')
export class TaskAssetController {
  constructor(private assetService: AssetService, private propertyService: PropertyService) {}

  @UseGuards(TaskAccessGuard)
  @Access('common.space.change')
  @Put('/:id/assets/:assetId')
  async changeAsset(@Body() body: ChangeAssetDTO, @Param('assetId') roleId: number) {
    return new AssetRes(await this.assetService.changeAsset(roleId, body));
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.add')
  @Post('/:id/assets')
  async addTaskAssets(
    @TargetTask() task: Task,
    @Body() body: AddAssetDTO,
    @CurrentUser() user: User,
  ) {
    return await this.assetService.addAsset(body.name, body.source, {
      uploader: user,
      task: task,
      ...body,
    });
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.view')
  @Get('/:id/assets')
  async getTaskAssets(
    @TargetTask() task: Task,
    @Query() query: GetAssetsDTO,
    @CurrentUser() user: User,
  ) {
    const properties = [];
    for (const key in query) {
      const type = key.split(':')[0];
      if (type === 'prop') {
        const property = await this.propertyService.getProperty(parseInt(key.split(':')[1]), true);
        const value = query[key];
        properties.push({
          property,
          value,
        });
      }
    }
    const assets = await this.assetService.getAssets({
      task,
      properties,
      ...query,
    });
    return ListResSerialize(assets, AssetListRes);
  }

  @UseGuards(TaskAccessGuard)
  @Access('common.task.remove')
  @Delete('/:id/assets/:assetId')
  async removeTaskAsset(
    @TargetTask() task: Task,
    @CurrentUser() user: User,
    @Param('assetId') assetId: number,
  ) {
    await this.assetService.deleteAsset(assetId);
    return { msg: 'ok' };
  }
}
