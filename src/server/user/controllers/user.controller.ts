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
import { Access } from '../access.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateUserDTO, GetUsersDTO, UserListRes } from '@dtos/user.dto';
import { IdDTO, ListResSerialize } from '@dtos/misc.dto';

@Controller('api/users')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  @Access('admin.user.browse', 'common.user.browse')
  @Get('/:id')
  async getUser(@Param() params: IdDTO) {
    const user = await this.userService.getUser(params.id);
    return user;
  }

  @Get()
  async getUsers(@Query() query: GetUsersDTO) {
    const users = await this.userService.getUsers(query);
    return ListResSerialize(users,UserListRes)
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    return this.userService.createUser(body.username, body.password);
  }

  @Delete('/:id')
  async deleteUser(@Param() params: IdDTO) {
    await this.userService.deleteUser(params.id);
    return { message: 'Deleted' };
  }
}
