import {
  Inject,
  Injectable,
  LoggerService,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class requestLogger implements NestMiddleware {
  // private readonly logger = new Logger('Http');

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async use(req: Request, res: Response, next: Function) {
    const start = new Date().getTime();
    await next();

    this.logger.debug(
      `Request Body: \n${JSON.stringify(req.body, null, 2)}\
      `.replace(/\n/g, '\n                        '),
    );
    this.logger.debug(
      `Response Body: \n${JSON.stringify(res.json, null, 2)}\
      `.replace(/\n/g, '\n                        '),
    );

    const duration = new Date().getTime() - start;
    this.logger.info(
      `${res.statusCode} ${req.method} ${req.originalUrl} +${duration}ms`,
    );
  }
}
