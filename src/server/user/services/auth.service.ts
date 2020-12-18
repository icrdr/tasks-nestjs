import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tokenPayload } from '../user.interface';
import { EntityManager, Connection } from 'typeorm';
import { User, Perm } from '../entities/user.entity';
import { sign } from 'jsonwebtoken';
import { hash } from '@utils/utils';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { CurrentUserRes, CurrentUserTokenRes, LoginDTO } from '@dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private roleService: RoleService,
    private manager: EntityManager,
  ) {}

  async authUser(username: string, password: string) {
    const user = await this.manager.findOne(User, {
      relations: ['roles'],
      where: {
        username: username,
        password: hash(username + password),
      },
    });

    if (!user) throw new NotFoundException('Auth Fail');

    const perms = await this.roleService.getPermsOfUser(user);
    const permCodes = perms.map((item) => item.code);
    const payload: tokenPayload = {
      id: user.id,
      perms: permCodes,
    };

    const token = sign(payload, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });

    const currentUserRes = new CurrentUserRes(user);
    currentUserRes.permCodes = permCodes;
    return {
      currentUser: currentUserRes,
      token,
    };
  }
}
