import {
  Controller,
  Inject,
  Post,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IsString } from 'class-validator';

class AuthUserDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

@Controller('api/login')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async authUser(@Body() body: AuthUserDTO) {
    const token = await this.authService.authUser(body.username, body.password);
    return { token: token };
  }
}
