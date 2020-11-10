import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { tokenPayload, currentUser } from '../common/common.interface';
import { UtilityService } from '../common/utility.service';
import { APP_GUARD } from '@nestjs/core';

@Injectable()
export class PermGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private utilityService: UtilityService,
    @Inject('JWT_LIB')
    private jwt: any,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const neededPerms = this.reflector.get<string[]>(
      'perms',
      context.getHandler(),
    );
    if (!neededPerms) return true;

    const res = context.switchToHttp().getRequest();
    const authorization = res.headers['authorization'];
    if (!authorization)
      throw new UnauthorizedException('no authorization is found');

    let decodedToken: tokenPayload;
    try {
      const token = authorization.split(' ')[1];
      decodedToken = this.jwt.verify(
        token,
        this.configService.get('jwtSecret'),
      ) as tokenPayload;
    } catch (error) {
      throw new UnauthorizedException('bad token');
    }

    const ownedPerms = decodedToken.perms;
    const validated: string[] = [];
    for (const neededPerm of neededPerms) {
      for (const ownedPerm of ownedPerms) {
        if (this.utilityService.stringMatch(neededPerm, ownedPerm)) {
          validated.push(neededPerm);
          break; //break nested loop
        }
      }
    }
    if (!validated) return false;

    const currentUser: currentUser = {
      id: decodedToken.id,
      perms: validated,
    };

    res.currentUser = currentUser;
    return true;
  }
}

export const permGuard = {
  provide: APP_GUARD,
  useClass: PermGuard,
};
