import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, Connection } from 'typeorm';
import { User } from '../entities/user.entity';
import { sign } from 'jsonwebtoken';
import { hash } from '@utils/utils';
import { CurrentUserRes, CurrentUserTokenRes, LoginDTO } from '@dtos/user.dto';
import { SpaceService } from '../../task/services/space.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private spaceService: SpaceService,
    private manager: EntityManager,
  ) {}

  async authUser(username: string, password: string) {
    const user = await this.manager.findOne(User, {
      where: {
        username: username,
        password: hash(username + password),
      },
    });

    if (!user) throw new NotFoundException('Auth Fail');

    const token = sign({ id: user.id }, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });
    const space = (await this.spaceService.getSpaces({ user: user, isPersonal: true }))[0][0];

    return {
      currentUser: user,
      personalSpace: space,
      token,
    };
  }
}
