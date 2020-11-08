import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  private readonly logger = new Logger('AppService');

  getHello(): string {
    this.logger.warn('Doing something...');
    return this.configService.get('dbUsername');
  }
}
