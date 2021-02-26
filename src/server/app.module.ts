import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';
import { DatabaseModule } from './database/database.module';
import { roleAccessGuard } from './user/roleAccess.guard';
import { configModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { TaskModule } from './task/task.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

const serveStaticModule = ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'client'),
});
const scheduleModule = ScheduleModule.forRoot();
const bullModule = BullModule.forRoot({});

@Module({
  imports: [
    bullModule,
    scheduleModule,
    serveStaticModule,
    configModule,
    LoggerModule,
    DatabaseModule,
    UserModule,
    TaskModule,
    OptionModule,
    // TagModule,
  ],
  providers: [roleAccessGuard],
})
export class AppModule {}
