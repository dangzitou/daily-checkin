import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { CurrentUser } from './current-user';

interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(JwtService)
    private readonly jwt: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const cookieName = this.config.get<string>('COOKIE_NAME') ?? 'wife_checkin_session';
    const token = request.cookies?.[cookieName];

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      request.user = { id: payload.sub, username: payload.username };
      return true;
    } catch {
      throw new UnauthorizedException('登录已失效');
    }
  }
}
