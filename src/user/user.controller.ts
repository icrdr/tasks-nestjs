import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UserController {
    
  @Get()
  getHello(): string {
    return 'sdfsdfsadfasdfasdfasef';
  }
}
