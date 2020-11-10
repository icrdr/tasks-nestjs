import {
  Inject,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = new Date().getTime();
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((err) => {
        // Status is not changed, because interceptor is before exception filter.
        // for logger request below, we have to change it here.
        res.status(err.status || 500);
        return throwError(err);
      }),
      finalize(() => {
        const duration = new Date().getTime() - start;
        let level: string;
        if (res.statusCode >= 400) {
          level = 'warn';
        } else {
          level = 'info';
        }
        this.logger.log(
          level,
          `${res.statusCode} ${req.method} ${req.originalUrl} +${duration}ms`,
        );
        if (Object.keys(req.body).length !== 0)
          this.logger.debug(
            `Request Body: \n${JSON.stringify(req.body, null, 2)}\
          `.replace(/\n/g, '\n                        '),
          );
      }),
    );
  }
}
