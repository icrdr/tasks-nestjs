import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { isPermArray } from '@utils/typeGuard';
import { Role, Perm, User } from '../entities/user.entity';
import { UserService } from './user.service';

@Injectable()
export class RoleService {
  constructor(private manager: EntityManager, private userService: UserService) {}

  async getRole(identify: string | number) {
    const role =
      typeof identify === 'string'
        ? await this.manager.findOne(Role, { name: identify })
        : await this.manager.findOne(Role, identify);
    if (!role) throw new NotFoundException('User was not found.');
    return role;
  }

  async createRole(
    name: string,
    options: {
      role?: Role | number | string;
      perms?: Perm[] | number[] | string[];
    },
  ) {
    const role = new Role();
    const perms = options.perms;
    if (perms) {
      if (!isPermArray(perms)) {
        let _perms: Perm[] = [];
        for (const identify of perms) {
          _perms.push((await this.loadPerm(identify))!);
        }
        role.perms = _perms;
      } else {
        role.perms = perms;
      }
    }
    role.name = name;
    await this.manager.save(role);
    return role;
  }

  async loadPerm(identify: string | number) {
    return typeof identify === 'string'
      ? (await this.manager.findOne(Perm, { code: identify })) ||
          (await this.manager.save(Perm, this.manager.create(Perm, { code: identify })))
      : await this.manager.findOne(Perm, identify);
  }

  async getPermsOfUser(user: User | string | number) {
    const userId = await this.userService.getUserId(user);

    return await this.manager
      .createQueryBuilder(Perm, 'perm')
      .leftJoin('perm.users', 'user')
      .leftJoin('perm.roles', 'role')
      .leftJoin('role.users', 'roleUser')
      .where('roleUser.id = :id', { id: userId })
      .orWhere('user.id = :id', { id: userId })
      .getMany();
  }

  async getRolesOfUser(user: User | string | number) {
    const userId = await this.userService.getUserId(user);

    return await this.manager
      .createQueryBuilder(Role, 'role')
      .leftJoin('role.users', 'user')
      .where('user.id = :id', { id: userId })
      .getMany();
  }
}
