import { WinstonModule } from 'nest-winston';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { WinstonConfigService } from './logger.service';


@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [CommonModule],
      useClass: WinstonConfigService,
    }),
  ],
})
export class LoggerModule {}
