import {
  Controller,
  Inject,
  Post,
  Body,
  NotFoundException,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IsString } from 'class-validator';
import { UserService } from '../services/user.service';
import { Perms } from '../perm.decorator';

export class loginDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService,
    private userService:UserService) {}

  @Post('/login')
  async login(@Body() body: loginDTO) {
    const token = await this.authService.authUser(body.username, body.password);
    return { token: token };
  }

  @Perms('common.user.auth')
  @Get('/currentUser')
  async getCurrentUser(@Req() req:any) {
    const user = await this.userService.getUser(req.currentUser.id);
    return user;
  }
}
