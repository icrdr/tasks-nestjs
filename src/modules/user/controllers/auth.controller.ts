import { Controller, Inject, Post, Body, NotFoundException, Get, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IsString } from 'class-validator';
import { UserService } from '../services/user.service';
import { Perms } from '../perm.decorator';
import { tokenPayload, currentUser } from '../user.interface';
import { loginDTO } from '@/dtos/user.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('/login')
  async login(@Body() body: loginDTO) {
    console.log(body)
    return await this.authService.authUser(body.username, body.password);
  }

  @Perms('common.user.auth')
  @Get('/me')
  async getMe(@Req() req: any) {
    const currentUser = req.currentUser as currentUser;
    return await this.authService.getMe(currentUser.id);
  }
}
