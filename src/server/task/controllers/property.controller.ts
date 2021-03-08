import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Access } from '@server/user/access.decorator';
import { TargetSpace } from '@server/user/user.decorator';
import { ListResSerialize } from '@dtos/misc.dto';
import { SpaceAccessGuard } from '@server/user/spaceAccess.guard';
import { Space } from '../entities/space.entity';
import { PropertyService } from '../services/property.service';
import {
  AddPropertyDTO,
  ChangePropertyDTO,
  GetPropertiesDTO,
  PropertyListRes,
  PropertyRes,
} from '@dtos/property.dto';

@Controller('api/spaces')
export class PropertyController {
  constructor(private propertyService: PropertyService) {}

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.change')
  @Put('/:id/properties/:propertyId')
  async changeSpaceProperty(
    @Body() body: ChangePropertyDTO,
    @Param('propertyId') propertyId: number,
  ) {
    return new PropertyRes(await this.propertyService.changeProperty(propertyId, body));
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.delete')
  @Delete('/:id/properties/:propertyId')
  async removeSpacePropertys(@Param('propertyId') propertyId: number) {
    await this.propertyService.removeProperty(propertyId);
    return { msg: 'ok' };
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.view')
  @Get('/:id/properties')
  async getSpacePropertys(@TargetSpace() space: Space, @Query() query: GetPropertiesDTO) {
    const properties = await this.propertyService.getProperties({
      space: space,
      ...query,
    });
    return ListResSerialize(properties, PropertyListRes);
  }

  @UseGuards(SpaceAccessGuard)
  @Access('common.space.add')
  @Post('/:id/properties')
  async addSpacePropertys(@TargetSpace() space: Space, @Body() body: AddPropertyDTO) {
    const property = await this.propertyService.addProperty(space, body.name, body.type, body.form);
    return new PropertyRes(property);
  }
}
