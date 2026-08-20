import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LogoutDto, RefreshDto, RegisterDto } from './dto/auth.dto';

export type JwtPayload = { sub: string; jti?: string };

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens & { user: PublicUser }> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new Error('EMAIL_IN_USE');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        profile: {
          create: {
            timezone: dto.timezone ?? 'America/Sao_Paulo',
          },
        },
        userXp: {
          create: { totalXp: 0, weekXp: 0 },
        },
        streak: {
          create: {},
        },
      },
      include: { profile: true },
    });

    await this.prisma.userRole.create({
      data: { userId: user.id, role: 'student' },
    });

    const tokens = await this.issueTokens(user.id);
    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });
    if (!user || user.status !== 'active') {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const tokens = await this.issueTokens(user.id);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let session: { id: string; userId: string } | null = null;
    for (const s of sessions) {
      if (await argon2.verify(s.refreshTokenHash, dto.refreshToken)) {
        session = s;
        break;
      }
    }
    if (!session) throw new Error('INVALID_REFRESH_TOKEN');

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.userId);
  }

  async logout(dto: LogoutDto): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null },
    });
    for (const s of sessions) {
      if (await argon2.verify(s.refreshTokenHash, dto.refreshToken)) {
        await this.prisma.session.update({
          where: { id: s.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return this.toPublicUser(user);
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const jti = randomUUID();
    const payload: JwtPayload = { sub: userId, jti };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ?? '15m') as never,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_TTL') ?? '30d') as never,
    });

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: await this.hash(refreshToken),
        expiresAt: this.expiryDate(
          this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
        ),
      },
    });

    return { accessToken, refreshToken };
  }

  private hash(token: string): Promise<string> {
    return argon2.hash(token, { type: argon2.argon2id });
  }

  private expiryDate(ttl: string): Date {
    const days = ttl.endsWith('d') ? Number(ttl.slice(0, -1)) : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    profile?: { headline: string | null; timezone: string } | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      headline: user.profile?.headline ?? null,
      timezone: user.profile?.timezone ?? 'America/Sao_Paulo',
    };
  }
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  timezone: string;
};
