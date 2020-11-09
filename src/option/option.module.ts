import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptionService } from './option.service';
import { Option } from './option.entity';
import { DatabaseModule } from '../database/database.module';

@Module({
  providers: [OptionService],
  exports: [OptionService],
})
export class OptionModule {}
