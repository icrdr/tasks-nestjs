import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: 500,
            message: exception.message,
            stack: exception.stack,
          };

    if (status >= 500) this.logger.error(exception.message, exception.stack);
    res.status(status).json(body);
  }
}
