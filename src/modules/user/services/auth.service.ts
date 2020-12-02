import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tokenPayload } from '../user.interface';
import { EntityManager, Connection } from 'typeorm';
import { User, Perm } from '../entities/user.entity';
import { sign } from 'jsonwebtoken';
import { hash } from '@/utils/utils';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { me } from '@/dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private roleService: RoleService,
    private userService: UserService,
    private manager: EntityManager,
  ) {}

  async authUser(username: string, password: string) {
    const user = await this.manager.findOne(User, {
      username: username,
      password: hash(username + password),
    });

    if (!user) throw new NotFoundException('Auth Fail');

    const perms = await this.roleService.getPermsOfUser(user);
    const permsString = perms.map((item) => item.code);
    const payload: tokenPayload = {
      id: user.id,
      perms: permsString,
    };

    const me: me = {
      id: user.id,
      username: user.username,
      perms: permsString,
    };

    const token = sign(payload, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });

    return {
      token,
      me,
    };
  }

  async getMe(user: User | number | string) {
    const _user = user instanceof User ? user : await this.userService.getUser(user);
    const perms = await this.roleService.getPermsOfUser(user);
    const permsString = perms.map((item) => item.code);

    const me: me = {
      id: _user.id,
      username: _user.username,
      perms: permsString,
    };

    return me;
  }
}
