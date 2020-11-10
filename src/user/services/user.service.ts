import { Inject, Injectable } from '@nestjs/common';
import { TypeGuardService } from '../../common/typeGuard.service';
import { UtilityService } from '../../common/utility.service';
import { OptionService } from '../../option/option.service';
import { EntityManager } from 'typeorm';
import { User, Role } from '../entities/user.entity';
import { RoleService } from './role.service';

@Injectable()
export class UserService {
  constructor(
    private optionService: OptionService,
    private roleService: RoleService,
    private utilityService: UtilityService,
    private typeGuardService: TypeGuardService,
    private manager: EntityManager,
  ) {}

  async getUser(identify: string | number) {
    return typeof identify === 'string'
      ? await this.manager.findOne(User, { username: identify })
      : await this.manager.findOne(User, identify);
  }

  async getUsers(options: { perPage: number; page: number }) {
    return await this.manager.findAndCount(User, {
      take: options.perPage,
      skip: options.page,
    });
  }

  async createUser(options: {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    mobile?: string | undefined;
    roles?: Role[] | number[] | string[];
  }) {
    const user = new User();
    const roles = options.roles;
    if (roles) {
      if (!this.typeGuardService.isRoleArray(roles)) {
        let _roles: Role[] = [];
        for (const identify of roles) {
          _roles.push((await this.roleService.getRole(identify))!);
        }
        user.roles = _roles;
      } else {
        user.roles = roles;
      }
    } else {
      const defaultRole = (await this.optionService.getOption('defaultRole'))!
        .value;
      user.roles = [(await this.roleService.getRole(defaultRole))!];
    }

    user.username = options.username;
    user.password = this.utilityService.hash(
      options.username + options.password,
    );
    if (options.fullName) user.fullName = options.fullName;
    if (options.email) user.email = options.email;
    if (options.mobile) user.mobile = options.mobile;
    await this.manager.save(user);
    return user;
  }

  async deleteUser(identify: string | number): Promise<void> {
    typeof identify === 'string'
      ? await this.manager.softDelete(User, { username: identify })
      : await this.manager.softDelete(User, identify);
  }
}
