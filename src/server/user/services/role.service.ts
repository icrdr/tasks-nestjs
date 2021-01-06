import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Role, User } from '../entities/user.entity';

@Injectable()
export class RoleService {
  constructor(private manager: EntityManager) {}

  async getRole(identify: string | number) {
    const role =
      typeof identify === 'string'
        ? (await this.manager.findOne(Role, { name: identify })) ||
          this.manager.save(Role, this.manager.create(Role, { name: identify }))
        : await this.manager.findOne(Role, identify);
    if (!role) throw new NotFoundException('Role was not found.');
    return role;
  }

  async setRole(role?: Role | number | string, access?: string[]) {
    role = role instanceof Role ? role : await this.getRole(role);
    role.access = access;
    return await this.manager.save(role);
  }
}
