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
import { TaskService } from '../task/services/task.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private taskService: TaskService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const neededAccess = this.reflector.get<string[]>('access', context.getHandler());
    if (!neededAccess) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.currentUser?.id;
    const taskId = req.params?.id || undefined;
    if (!userId || !taskId || !isIntString(taskId)) return false;
    const task = await this.taskService.getTask(taskId);
    const ownedAccess = await this.taskService.getTaskAccess(task, userId);
    const validAccess =
      neededAccess.length === 0 ? ownedAccess : getValidAccess(neededAccess, ownedAccess);
    if (validAccess.length === 0) return false;
    req['targetTask'] = task;
    return true;
  }
}

export const taskAccessGuard = {
  provide: APP_GUARD,
  useClass: TaskAccessGuard,
};
