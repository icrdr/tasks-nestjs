import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, Connection } from 'typeorm';
import { User } from '../entities/user.entity';
import { sign } from 'jsonwebtoken';
import { hash } from '@utils/utils';
import { RoleService } from './role.service';
import { CurrentUserRes, CurrentUserTokenRes, LoginDTO } from '@dtos/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
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

    const token = sign({ id: user.id }, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });

    const currentUserRes = new CurrentUserRes(user);
    return {
      currentUser: user,
      token,
    };
  }
}
