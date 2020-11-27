import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { tokenPayload, currentUser } from './user.interface';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getValidPerms } from '@/utils/utils';

@Injectable()
export class PermGuard implements CanActivate {
  constructor(private reflector: Reflector, private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const neededPerms = this.reflector.get<string[]>('perms', context.getHandler());
    if (!neededPerms) return true;

    const req: Request = context.switchToHttp().getRequest();
    const authorization = req.headers['authorization'];
    if (!authorization) throw new UnauthorizedException('no authorization is found');

    let payload: tokenPayload;
    try {
      const token = authorization.split(' ')[1];
      payload = verify(token, this.configService.get('jwtSecret')) as tokenPayload;
    } catch (error) {
      throw new UnauthorizedException('bad token');
    }

    const ownedPerms = payload.perms;
    const validPerms =
      neededPerms.length === 0 ? ownedPerms : getValidPerms(neededPerms, payload.perms);
    if (validPerms.length === 0) return false;

    const currentUser: currentUser = {
      id: payload.id,
      perms: validPerms,
    };

    req['currentUser'] = currentUser;
    return true;
  }
}

export const permGuard = {
  provide: APP_GUARD,
  useClass: PermGuard,
};
