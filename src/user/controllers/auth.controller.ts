import { Controller, Inject, Post, Body, NotFoundException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IsString } from 'class-validator';

class AuthUserDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

@Controller('api/auth')
export class AuthController {
  @Inject()
  private authService: AuthService;

  @Post()
  async authUser(@Body() body: AuthUserDTO) {
    const token = await this.authService.authUser(body.username, body.password);
    if (!token) throw new NotFoundException('Auth Fail');

    return { token: token };
  }
}
