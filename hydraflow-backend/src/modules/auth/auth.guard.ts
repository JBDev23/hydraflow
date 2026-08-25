import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { getJwtSecret } from '../../lib/jwt';
import { IS_PUBLIC_KEY } from '../common/public.decorator';

export type AuthRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new HttpException({ error: 'Token missing' }, HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HttpException({ error: 'Token missing' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = jwt.verify(token, getJwtSecret()) as { userId: string };
      if (!payload?.userId) {
        throw new HttpException({ error: 'Invalid token' }, HttpStatus.UNAUTHORIZED);
      }
      request.userId = payload.userId;
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ error: 'Invalid token' }, HttpStatus.UNAUTHORIZED);
    }
  }
}
