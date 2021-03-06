import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OptionService } from '../../option/option.service';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';
import { hash } from '@utils/utils';
import { GetUsersDTO } from '@dtos/user.dto';
import { useResponsive } from 'ahooks';
import { SpaceService } from '../../task/services/space.service';
import { RoleType } from '../../common/common.entity';

@Injectable()
export class UserService {
  userQuery: SelectQueryBuilder<User>;
  constructor(private manager: EntityManager) {
    this.userQuery = this.manager.createQueryBuilder(User, 'user');
  }

  async isUsernameAvailable(username: string) {
    const user = await this.manager.findOne(User, { username: username });
    if (user) throw new ForbiddenException('Username existed');
  }

  async getUserId(user: User | number) {
    user = user instanceof User ? user : await this.getUser(user);
    return user.id;
  }

  async getUser(identify: string | number, exception = true) {
    let query = this.userQuery.clone();

    query =
      typeof identify === 'number'
        ? query.where('user.id = :identify', { identify })
        : query.where('user.username = :identify', { identify });

    const user = await query.getOne();
    if (!user && exception) throw new NotFoundException('User was not found.');
    return user;
  }

  async getUsers(
    options: {
      username?: string;
      fullName?: string;
      pageSize?: number;
      current?: number;
    } = {},
  ) {
    let query = this.userQuery.clone();

    if (options.username) {
      query = query.where('user.username LIKE :username', { username: `%${options.username}%` });
    }

    if (options.fullName) {
      query = query.where('user.fullName LIKE :fullName', { fullName: `%${options.fullName}%` });
    }

    query = query
      .orderBy('user.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async addUser(
    username: string,
    password: string,
    options: {
      fullName?: string;
      email?: string;
      mobile?: string;
      role?: RoleType;
    } = {},
  ) {
    await this.isUsernameAvailable(username);

    let user = new User();
    user.username = username;
    user.password = hash(username + password);
    if (options.fullName) user.fullName = options.fullName;
    if (options.email) user.email = options.email;
    if (options.mobile) user.mobile = options.mobile;
    if (options.role) user.role = options.role;
    user = await this.manager.save(user);

    return user;
  }

  async deleteUser(identify: string | number): Promise<void> {
    const user = await this.getUser(identify);
    await this.manager.softDelete(User, user);
  }
}
