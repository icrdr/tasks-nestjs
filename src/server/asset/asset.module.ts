import { Module } from '@nestjs/common';
import { OptionService } from '../option/option.service';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

@Module({
  controllers: [AssetController],
  providers: [AssetService,OptionService],
})
export class AssetModule {}
