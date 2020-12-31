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
import { getValidPerms } from '@utils/utils';

@Injectable()
export class PermGuard implements CanActivate {
  constructor(private reflector: Reflector, private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const neededPerms = this.reflector.get<string[]>('perms', context.getHandler());
    if (!neededPerms) return true;
    let req:any
    let token: string;
    //@ts-ignore
    switch (context.contextType) {
      case 'http':
        req = context.switchToHttp().getRequest();
        const authorization = req.headers['authorization'];

        token = authorization?.split(' ')[1];
        break;
      case 'ws':
        req = context.switchToWs().getClient()
        token = req._protocol;
        break;
      default:
        break;
    }
    if (!token) throw new UnauthorizedException('no authorization token was found');
    let payload: tokenPayload;
    try {
      payload = verify(token, this.configService.get('jwtSecret')) as tokenPayload;
    } catch (error) {
      throw new UnauthorizedException('bad token');
    }

    const ownedPerms = payload.perms;
    const validPerms =
      neededPerms.length === 0 ? ownedPerms : getValidPerms(neededPerms, ownedPerms);
    if (validPerms.length === 0) return false;

    const currentUser: currentUser = {
      id:  payload.id,
      validPerms: validPerms,
      ownedPerms: ownedPerms,
    };

    req['currentUser'] = currentUser;
    return true;
  }
}

export const permGuard = {
  provide: APP_GUARD,
  useClass: PermGuard,
};
