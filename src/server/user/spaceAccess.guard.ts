import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getValidAccess, isIntString } from '@utils/utils';
import { SpaceService } from '../task/services/space.service';

@Injectable()
export class SpaceAccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private spaceService: SpaceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const neededAccess = this.reflector.get<string[]>('access', context.getHandler());
    if (!neededAccess) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.currentUser?.id;
    const spaceId = req.params?.id || undefined;
    if (!userId || !spaceId || !isIntString(spaceId)) return false;

    const ownedAccess = await this.spaceService.getSpaceAccess(spaceId, userId);
    const validAccess =
      neededAccess.length === 0 ? ownedAccess : getValidAccess(neededAccess, ownedAccess);
    if (validAccess.length === 0) return false;
    req['targetSpace'] = this.spaceService.getSpace(spaceId);
    return true;
  }
}

export const spaceAccessGuard = {
  provide: APP_GUARD,
  useClass: SpaceAccessGuard,
};
