import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TypeGuardService } from '../../common/typeGuard.service';
import { EntityManager } from 'typeorm';
import { Role, Perm } from '../entities/user.entity';

@Injectable()
export class RoleService {
  constructor(
    private manager: EntityManager,
    private typeGuardService: TypeGuardService,
  ) {}

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
      if (!this.typeGuardService.isPermArray(perms)) {
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
          (await this.manager.save(
            Perm,
            this.manager.create(Perm, { code: identify }),
          ))
      : await this.manager.findOne(Perm, identify);
  }
}
