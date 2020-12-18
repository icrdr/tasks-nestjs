import { Controller, Inject, Post, Body, NotFoundException, Get, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IsString } from 'class-validator';
import { UserService } from '../services/user.service';
import { Perms } from '../perm.decorator';
import { tokenPayload, currentUser } from '../user.interface';
import { CurrentUserRes, CurrentUserTokenRes, LoginDTO } from '@dtos/user.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('/login')
  async login(@Body() body: LoginDTO) {
    const authUser = await this.authService.authUser(body.username, body.password);
    return new CurrentUserTokenRes(authUser);
  }

  @Perms('common.user.auth')
  @Get('/currentUser')
  async getMe(@Req() req: any) {
    const currentUser = req.currentUser as currentUser;
    const user = await this.userService.getUser(currentUser.id);
    const currentUserRes = new CurrentUserRes(user);
    currentUserRes.permCodes = currentUser.ownedPerms;
    return currentUserRes;
  }
}
