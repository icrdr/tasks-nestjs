import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OptionService } from '../../option/option.service';
import { EntityManager } from 'typeorm';
import { User, Role } from '../entities/user.entity';
import { RoleService } from './role.service';
import { isRoleArray } from '@/utils/typeGuard';
import { hash } from '@/utils/utils';
import { GetUsersDTO } from '@/dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    private optionService: OptionService,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
    private manager: EntityManager,
  ) {}

  async isUsernameAvailable(username: string) {
    const user = await this.manager.findOne(User, { username: username });
    if (user) throw new ForbiddenException('Username existed');
  }

  async getUserId(user: User | string | number) {
    let userId: number;
    if (user instanceof User) {
      return user.id;
    } else if (typeof user === 'string') {
      return (await this.getUser(user)).id;
    } else {
      return user;
    }
  }

  async getUser(identify: string | number) {
    const user =
      typeof identify === 'string'
        ? await this.manager.findOne(User, { username: identify })
        : await this.manager.findOne(User, identify);
    if (!user) throw new NotFoundException('User was not found.');
    return user;
  }

  async getUsers(options: GetUsersDTO = {}) {
    return await this.manager.findAndCount(User, {
      take: options.pageSize || 5,
      skip: options.current - 1 || 0,
    });
  }

  async createUser(
    username: string,
    password: string,
    options: {
      fullName?: string;
      email?: string;
      mobile?: string;
      roles?: Role[] | number[] | string[];
    } = {},
  ) {
    await this.isUsernameAvailable(username);

    const user = new User();
    const roles = options.roles;
    if (roles) {
      if (!isRoleArray(roles)) {
        let _roles: Role[] = [];
        for (const identify of roles) {
          _roles.push((await this.roleService.getRole(identify))!);
        }
        user.roles = _roles;
      } else {
        user.roles = roles;
      }
    } else {
      const defaultRole = (await this.optionService.getOption('defaultRole'))!.value;
      user.roles = [(await this.roleService.getRole(defaultRole))!];
    }

    user.username = username;
    user.password = hash(username + password);
    if (options.fullName) user.fullName = options.fullName;
    if (options.email) user.email = options.email;
    if (options.mobile) user.mobile = options.mobile;
    await this.manager.save(user);
    return user;
  }

  async deleteUser(identify: string | number): Promise<void> {
    const user = await this.getUser(identify);
    await this.manager.softDelete(User, user);
  }
}
