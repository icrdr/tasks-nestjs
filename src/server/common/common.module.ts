import { Module } from '@nestjs/common';
import { OptionService } from '../option/option.service';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
  controllers:[CommonController],
  providers: [CommonService, OptionService],
  exports: [CommonService, OptionService],
})
export class CommonModule {}
