import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Http');

  async use(req: Request, res: Response, next: Function) {
    const start = new Date().getTime();
    await next();
    const duration = new Date().getTime() - start;
    this.logger.log(
      `${res.statusCode} ${req.method} ${req.originalUrl} +${duration}ms`,
    );
  }
}
