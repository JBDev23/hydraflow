import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getTzOffsetFromRequest, type TzOffsetRequest } from '../../lib/dayRange';

export const TzOffset = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<TzOffsetRequest>();
  return getTzOffsetFromRequest(request);
});
