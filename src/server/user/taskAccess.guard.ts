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
import { getValidAccess } from '@utils/utils';
import { TaskService } from '../task/services/task.service';
import { EntityManager } from 'typeorm';
import { Member } from '../task/entities/member.entity';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private taskService: TaskService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const neededAccess = this.reflector.get<string[]>('access', context.getHandler());
    if (!neededAccess) return true;
    
    const req = context.switchToHttp().getRequest();
    const userId = req.currentUser?.id;
    const taskId = req.params?.id || undefined;
    if (!userId || !taskId || !/(^[1-9]\d*$)/.test(taskId)) return false;

    const member = await this.taskService.getMember(taskId,userId);
    if (!member) return false;

    const ownedAccess = member.access;
    const validAccess =
      neededAccess.length === 0 ? ownedAccess : getValidAccess(neededAccess, ownedAccess);
    if (validAccess.length === 0) return false;

    req['targetTask'] = member.task;
    req['currentUser'] = member.user;
    return true;
  }
}

export const taskAccessGuard = {
  provide: APP_GUARD,
  useClass: TaskAccessGuard,
};
