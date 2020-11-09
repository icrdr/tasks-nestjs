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
import { APP_GUARD } from '@nestjs/core';
import { PermGuard } from './user/perm.guard';
import { LoggerMiddleware } from './logger/logger.middleware';
import { configModule } from './config/config.module';

import { WinstonModule, WinstonModuleOptions } from 'nest-winston';
import { transports, format } from 'winston';
import 'winston-daily-rotate-file';
import { Chalk } from 'chalk';

const permGuard = {
  provide: APP_GUARD,
  useClass: PermGuard,
};

@Injectable()
class WinstonConfigService {
  @Inject('CHALK_LIB')
  private chalk: Chalk;

  loggerContent(isColored: boolean) {
    return format.printf(({ timestamp, level, message, stack }) => {
      const prefix = `${this.chalk.gray(timestamp)} `;
      level = level.toUpperCase();
      let suffix: string;
      switch (level) {
        case 'ERROR':
          suffix = `${this.chalk.bgRed.black(level)} ${this.chalk.red(
            message,
          )} \
          \n${this.chalk.red(stack)}`.replace(
            /\n/g,
            '\n                        ',
          );
          break;
        case 'WARN':
          suffix = `${this.chalk.bgYellow.black(level)} ${this.chalk.yellow(
            message,
          )}`;
          break;
        case 'INFO':
          suffix = `${this.chalk.bgGreen.black(level)} ${this.chalk.green(
            message,
          )}`;
          break;
        case 'HTTP':
          suffix = `${this.chalk.bgCyan.black(level)} ${this.chalk.cyan(
            message,
          )}`;
          break;
        case 'DEBUG':
          suffix = `${this.chalk.bgGrey.black(level)} ${this.chalk.grey(
            message,
          )}`;
          break;
        default:
          suffix = `${this.chalk.bgRed.black(level)} ${this.chalk.red(
            message,
          )}`;
          break;
      }
      if (isColored) {
        return prefix + suffix;
      } else {
        return (prefix + suffix).replace(
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          '',
        );
      }
    });
  }

  createWinstonModuleOptions(): WinstonModuleOptions {
    return {
      level: 'debug',
      format: format.combine(
        format.timestamp({
          format: 'YY-MM-DD HH:MM:SS',
        }),
        format.errors({ stack: true }),
      ),
      transports: [
        new transports.DailyRotateFile({
          format: format.combine(this.loggerContent(false)),
          filename: '%DATE%.log',
          dirname: 'log',
          datePattern: 'YYYY-MM-DD',
          level: 'http',
        }),
        new transports.Console({
          silent: false,
          format: format.combine(this.loggerContent(true)),
        }),
      ],
    };
  }
}

@Module({
  imports: [
    CommonModule,
    WinstonModule.forRootAsync({
      imports: [CommonModule],
      useClass: WinstonConfigService,
    }),
    configModule,
    DatabaseModule,
    UserModule,
    OptionModule,
  ],
  providers: [permGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
