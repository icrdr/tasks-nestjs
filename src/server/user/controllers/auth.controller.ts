import { Controller, Inject, Post, Body, NotFoundException, Get, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Access } from '../access.decorator';
import { tokenPayload } from '../user.interface';
import { CurrentUserRes, CurrentUserTokenRes, LoginDTO } from '@dtos/user.dto';
import { User } from '../entities/user.entity';
import { CurrentUser } from '../user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('/login')
  async login(@Body() body: LoginDTO) {
    const authUser = await this.authService.authUser(body.username, body.password);
    return new CurrentUserTokenRes(authUser);
  }

  @Access('common.user.auth')
  @Get('/currentUser')
  async getMe(@CurrentUser() currentUser: User) {
    const user = await this.userService.getUser(currentUser.id);
    return new CurrentUserRes(user);
  }
}
