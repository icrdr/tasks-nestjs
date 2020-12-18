import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { currentUser } from './user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): currentUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.currentUser;
  },
);
