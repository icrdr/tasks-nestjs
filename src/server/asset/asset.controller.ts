import { Controller, Get } from '@nestjs/common';
import { AssetService } from './asset.service';

@Controller('api/assets')
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Get('oss')
  async getStsToken() {
    const token = await this.assetService.getStsToken();
    return token;
  }
}
