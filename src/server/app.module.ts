import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { permGuard } from './user/perm.guard';
import { configModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { TaskModule } from './task/task.module';
import { TagModule } from './tag/tag.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist'),
    }),
    CommonModule,
    configModule,
    LoggerModule,
    DatabaseModule,
    UserModule,
    OptionModule,
    TaskModule,
    TagModule,
  ],
  providers: [permGuard],
})
export class AppModule {}
