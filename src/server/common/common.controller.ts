import { Controller, Get } from '@nestjs/common';
import { CommonService } from './common.service';

@Controller('api/')
export class CommonController {
  constructor(private assetService: CommonService) {}

  @Get('oss')
  async getStsToken() {
    const token = await this.assetService.getStsToken();
    return token;
  }
}
