import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';

import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { APP_GUARD } from '@nestjs/core';
import { PermGuard } from './user/perm.guard';
import { LoggerMiddleware } from './logger/logger.middleware';
import { configModule } from './config/config.module';

const authGuard = {
  provide: APP_GUARD,
  useClass: PermGuard,
};

@Module({
  imports: [
    CommonModule,
    configModule,
    DatabaseModule,
    UserModule,
    OptionModule,
  ],
  providers: [authGuard],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
