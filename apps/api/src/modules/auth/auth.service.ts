import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicUser {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  points: number;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwt: JwtService,
    @Inject(ConfigService)
    private readonly config: ConfigService
  ) {}

  async register(input: { username: string; email?: string | null; password: string }): Promise<PublicUser> {
    const username = input.username.trim();
    const email = input.email?.trim().toLowerCase() || null;
    const existing = await this.prisma.user.findFirst({
      where: email ? { OR: [{ username }, { email }] } : { username }
    });

    if (existing) {
      throw new ConflictException('用户名或邮箱已被使用');
    }

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await argon2.hash(input.password)
      },
      select: { id: true, username: true, email: true, isAdmin: true, points: true }
    });

    return user;
  }

  async login(input: { identifier: string; password: string }): Promise<{ user: PublicUser; token: string }> {
    const identifier = input.identifier.trim();
    const id = /^\d+$/.test(identifier) ? Number(identifier) : undefined;
    const user = await this.prisma.user.findFirst({
      where: id ? { id } : { username: identifier },
      select: { id: true, username: true, email: true, isAdmin: true, points: true, passwordHash: true }
    });

    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('账号或密码不正确');
    }

    const token = this.jwt.sign(
      { sub: user.id, username: user.username },
      {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret',
        expiresIn: '30d'
      }
    );

    return {
      user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin, points: user.points },
      token
    };
  }

  async me(userId: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, username: true, email: true, isAdmin: true, points: true }
    });
    return user;
  }
}
