import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tokenPayload } from '../user.interface';
import { UtilityService } from '../../common/utility.service';
import { EntityManager } from 'typeorm';
import { User, Perm } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('JWT_LIB')
    private jwt: any,
    private configService: ConfigService,
    private manager: EntityManager,
    private utilityService: UtilityService,
  ) {}

  async authUser(username: string, password: string) {
    const user = await this.manager.findOne(User, {
      username: username,
      password: this.utilityService.hash(username + password),
    });

    if (!user) return undefined;
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
    return this.jwt.sign(payload, this.configService.get('jwtSecret'), {
      expiresIn: '24h',
    });
  }
}
