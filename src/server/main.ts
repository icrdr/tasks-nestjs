import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { ErrorHandler } from './error/error.filter';
import { RequestLoggerInterceptor } from './logger/logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const winston = app.get(WINSTON_MODULE_PROVIDER);
  const reflector = app.get(Reflector);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        //FIXME: auto transform type. but boolean not working
        //FIXME: also not working to array
        enableImplicitConversion: true, 
      },
    }),
  );
  app.useGlobalInterceptors(
    new RequestLoggerInterceptor(winston),
    new ClassSerializerInterceptor(reflector),
  );
  app.useGlobalFilters(new ErrorHandler(winston));
  await app.listen(3000);
}
bootstrap();
