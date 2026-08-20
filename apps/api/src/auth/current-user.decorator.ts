import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): { userId: string } => {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    return request.user!;
  },
);
