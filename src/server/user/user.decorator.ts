import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Task } from '../task/entities/task.entity';
import { User } from './entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    return req.currentUser;
  },
);

export const TargetTask = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Task => {
    const req = ctx.switchToHttp().getRequest();
    return req.targetTask;
  },
);

export const TargetSpace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Task => {
    const req = ctx.switchToHttp().getRequest();
    return req.targetSpace;
  },
);
