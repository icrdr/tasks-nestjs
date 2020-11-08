import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformPath } from 'path';

@Controller('users')
export class UserController {
  constructor(
    private configService: ConfigService,
    @Inject('PATH') private path: PlatformPath,
  ) {}

  private readonly logger = new Logger('AppService');

  @Get()
  getHello(): string {
    console.log(this.path.join(__dirname, '..'));
    this.logger.warn('Doing something...');
    return this.configService.get('dbUsername');
  }
}
