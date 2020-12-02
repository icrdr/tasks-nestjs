import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';

import { Perms } from '../perm.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Type } from 'class-transformer';
import { CreateUserDTO, GetUsersDTO } from '@/dtos/user.dto';

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
    return this.userService.createUser(body.username, body.password);
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    await this.userService.deleteUser(id);
    return { message: 'Deleted' };
  }
}
