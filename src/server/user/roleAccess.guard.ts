import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { tokenPayload } from './user.interface';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getValidAccess, unionArrays } from '@utils/utils';
import { UserService } from './services/user.service';

@Injectable()
export class RoleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const neededAccess = this.reflector.get<string[]>('access', context.getHandler());
    if (!neededAccess) return true;
    const req = context.switchToHttp().getRequest();
    const token = req.headers?.authorization?.split(' ')[1] || req._protocol;
    if (!token) throw new UnauthorizedException('no authorization token was found');
    let payload: tokenPayload;
    try {
      payload = verify(token, this.configService.get('jwtSecret')) as tokenPayload;
    } catch (error) {
      throw new UnauthorizedException('bad token');
    }
    const currentUser = await this.userService.getUser(payload.id);
    const ownedAccess = this.configService.get('roleAccess')[currentUser.role];
    const validAccess =
      neededAccess.length === 0 ? ownedAccess : getValidAccess(neededAccess, ownedAccess);
    if (validAccess.length === 0) return false;

    req['currentUser'] = currentUser;
    req['validAccess'] = validAccess;
    return true;
  }
}

export const roleAccessGuard = {
  provide: APP_GUARD,
  useClass: RoleAccessGuard,
};
