import {
  Inject,
  Injectable,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';

import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';

import { permGuard } from './user/perm.guard';
import { requestLogger } from './logger/logger.middleware';
import { configModule } from './config/config.module';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    CommonModule,
    configModule,
    LoggerModule,
    DatabaseModule,
    UserModule,
    OptionModule,
  ],
  providers: [permGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestLogger).forRoutes('*');
  }
}
