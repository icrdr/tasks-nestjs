import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tokenPayload } from '../user.interface';
import { EntityManager } from 'typeorm';
import { User, Perm } from '../entities/user.entity';
import { sign } from 'jsonwebtoken';
import { hash } from '../../utils';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private manager: EntityManager,
  ) {}

  async authUser(username: string, password: string) {
    const user = await this.manager.findOne(User, {
      username: username,
      password: hash(username + password),
    });

    if (!user) throw new NotFoundException('Auth Fail');

    const perms = await this.manager
      .createQueryBuilder(Perm, 'perm')
      .leftJoin('perm.users', 'user')
      .leftJoin('perm.roles', 'role')
      .leftJoin('role.users', 'roleUser')
      .where('roleUser.id = :id', { id: user.id })
      .orWhere('user.id = :id', { id: user.id })
      .getMany();

    const payload: tokenPayload = {
      id: user.id,
      perms: perms.map((item) => item.code),
    };
    return sign(payload, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });
  }
}
