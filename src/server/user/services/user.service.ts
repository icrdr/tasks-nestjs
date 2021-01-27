import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OptionService } from '../../option/option.service';
import { EntityManager } from 'typeorm';
import { User, RoleType } from '../entities/user.entity';
import { hash } from '@utils/utils';
import { GetUsersDTO } from '@dtos/user.dto';
import { useResponsive } from 'ahooks';

@Injectable()
export class UserService {
  constructor(private manager: EntityManager) {}

  async isUsernameAvailable(username: string) {
    const user = await this.manager.findOne(User, { username: username });
    if (user) throw new ForbiddenException('Username existed');
  }

  async getUserId(user: User | string | number) {
    user = user instanceof User ? user : await this.getUser(user);
    return user.id;
  }

  async getUser(identify: string | number, exception = true) {
    let query = this.manager.createQueryBuilder(User, 'user');

    query =
      typeof identify === 'number'
        ? query.where('user.id = :identify', { identify })
        : query.where('user.username = :identify', { identify });

    const user = await query.getOne();
    if (!user && exception) throw new NotFoundException('User was not found.');
    return user;
  }

  async getUsers(options: GetUsersDTO = {}) {
    let query = this.manager.createQueryBuilder(User, 'user');
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

  async createUser(
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

    const user = new User();
    user.username = username;
    user.password = hash(username + password);
    if (options.fullName) user.fullName = options.fullName;
    if (options.email) user.email = options.email;
    if (options.mobile) user.mobile = options.mobile;
    if (options.role) user.role = options.role;
    await this.manager.save(user);
    return user;
  }

  async deleteUser(identify: string | number): Promise<void> {
    const user = await this.getUser(identify);
    await this.manager.softDelete(User, user);
  }
}
