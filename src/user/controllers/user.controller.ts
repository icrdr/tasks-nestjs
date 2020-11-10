import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { IsString, IsNumberString, IsOptional } from 'class-validator';
import { Perms } from '../../user/perm.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

class CreateUserDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

class GetUsersDTO {
  @IsNumberString()
  @IsOptional()
  perPage: number;

  @IsNumberString()
  @IsOptional()
  page: number;
}

@Controller('api/users')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  @Perms('admin.user.browse', 'common.user.browse')
  @Get('/:id')
  async getUser(@Param('id') id: number) {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException('User was not found.');
    return user;
  }

  @Get()
  async getUsers(@Query() query: GetUsersDTO) {
    const users = await this.userService.getUsers({
      perPage: query.perPage || 5,
      page: query.page || 0,
    });
    return users;
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    const user = await this.userService.getUser(body.username);
    if (user) throw new ForbiddenException('Username existed');

    return this.userService.createUser({
      username: body.username,
      password: body.password,
    });
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException('User was not found.');

    await this.userService.deleteUser(id);
    return { message: 'Deleted' };
  }
}
