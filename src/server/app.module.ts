import { Module } from '@nestjs/common';
import { AssetModule } from './asset/asset.module';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';
import { DatabaseModule } from './database/database.module';
import { roleAccessGuard } from './user/roleAccess.guard';
import { configModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { TaskModule } from './task/task.module';
import { TagModule } from './tag/tag.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

const serveStaticModule = ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'client'),
});

@Module({
  imports: [
    serveStaticModule,
    configModule,
    LoggerModule,
    DatabaseModule,
    UserModule,
    AssetModule,
    OptionModule,
    TaskModule,
    TagModule,
  ],
  providers: [roleAccessGuard],
})
export class AppModule {}
