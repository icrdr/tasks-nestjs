import { WinstonModuleOptions } from 'nest-winston';
import { transports, format } from 'winston';
import 'winston-daily-rotate-file';
import { Chalk } from 'chalk';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WinstonConfigService {
  constructor(
    private configService: ConfigService,

    @Inject('CHALK_LIB')
    private chalk: Chalk,
  ) {}

  loggerContent(isColored: boolean) {
    return format.printf(({ timestamp, level, message, stack }) => {
      const {
        red,
        bgRed,
        bgYellow,
        yellow,
        bgGreen,
        green,
        bgGrey,
        grey,
        bgCyan,
        cyan,
      } = this.chalk;
      const prefix = `${grey(timestamp)} `;
      level = level.toUpperCase();
      let suffix: string;
      switch (level) {
        case 'ERROR':
          // suffix = `${bgRed.black(level)} ${red(message)} \
          // \n${red(stack)}`.replace(/\n/g, '\n                        ');
          suffix = `${bgRed.black(level)} ${red(stack)}`.replace(
            /\n/g,
            '\n                        ',
          );
          break;
        case 'WARN':
          suffix = `${bgYellow.black(level)} ${yellow(message)}`;
          break;
        case 'INFO':
          suffix = `${bgGreen.black(level)} ${green(message)}`;
          break;
        case 'HTTP':
          suffix = `${bgCyan.black(level)} ${cyan(message)}`;
          break;
        default:
          suffix = `${bgGrey.black(level)} ${grey(message)}`;
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
      level: this.configService.get('logLevel'),
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
          dirname: 'logs',
          datePattern: 'YYYY-MM-DD',
          level: 'http',
        }),
        new transports.Console({
          format: format.combine(this.loggerContent(true)),
        }),
      ],
    };
  }
}
