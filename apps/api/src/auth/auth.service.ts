import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  UpdateMeDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

export type JwtPayload = { sub: string; jti?: string };

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  timezone: string;
  status: string;
  roles: string[];
  careerGoal: string | null;
  learningStyle: string | null;
  createdAt?: Date;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------- Registro ----------

  async register(dto: RegisterDto): Promise<AuthTokens & { user: PublicUser }> {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('EMAIL_IN_USE');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash,
          profile: {
            create: {
              timezone: dto.timezone ?? 'America/Sao_Paulo',
              learningStyle: dto.learningStyle,
              careerGoal: dto.careerGoal,
            },
          },
          userXp: { create: { totalXp: 0, weekXp: 0 } },
          streak: { create: { timezone: dto.timezone ?? 'America/Sao_Paulo' } },
        },
        include: { profile: true },
      });
      await tx.userRole.create({
        data: { userId: created.id, role: 'student' },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: created.id,
          action: 'user.register',
          resourceType: 'user',
          resourceId: created.id,
          after: { email },
        },
      });
      return created;
    });

    const tokens = await this.issueTokens(user.id);
    return { ...tokens, user: await this.toPublicUser(user.id) };
  }

  // ---------- Login ----------

  async login(dto: LoginDto): Promise<AuthTokens & { user: PublicUser }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (user.status === 'suspended') throw new Error('ACCOUNT_SUSPENDED');
    if (user.status === 'deleted' || user.deletedAt)
      throw new Error('ACCOUNT_DELETED');
    if (user.status !== 'active') throw new Error('INVALID_CREDENTIALS');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    const tokens = await this.issueTokens(user.id);
    return { ...tokens, user: await this.toPublicUser(user.id) };
  }

  // ---------- Refresh (rotação) ----------

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true, refreshTokenHash: true },
    });

    let matched: { id: string; userId: string } | null = null;
    for (const s of sessions) {
      if (await argon2.verify(s.refreshTokenHash, dto.refreshToken)) {
        matched = s;
        break;
      }
    }
    if (!matched) throw new Error('INVALID_REFRESH_TOKEN');

    // revoga antigo e emite novo (rotação)
    await this.prisma.session.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    // verifica payload para extrair user id e garantir que token não foi forjado
    try {
      await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    return this.issueTokens(matched.userId);
  }

  // ---------- Logout ----------

  async logout(dto: LogoutDto): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { revokedAt: null },
      select: { id: true, refreshTokenHash: true },
    });
    for (const s of sessions) {
      if (await argon2.verify(s.refreshTokenHash, dto.refreshToken)) {
        await this.prisma.session.update({
          where: { id: s.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------- Me / UpdateMe ----------

  async me(userId: string): Promise<PublicUser> {
    return this.toPublicUser(userId);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<PublicUser> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data });
    }

    const profileData: Record<string, unknown> = {};
    if (dto.headline !== undefined) profileData.headline = dto.headline;
    if (dto.bio !== undefined) profileData.bio = dto.bio;
    if (dto.timezone !== undefined) profileData.timezone = dto.timezone;
    if (dto.linkedinUrl !== undefined)
      profileData.linkedinUrl = dto.linkedinUrl;
    if (dto.githubUrl !== undefined) profileData.githubUrl = dto.githubUrl;
    if (dto.learningStyle !== undefined)
      profileData.learningStyle = dto.learningStyle;
    if (dto.careerGoal !== undefined) profileData.careerGoal = dto.careerGoal;

    if (Object.keys(profileData).length > 0) {
      await this.prisma.profile.upsert({
        where: { userId },
        create: { userId, ...profileData } as any,
        update: profileData as any,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'user.update_profile',
        resourceType: 'user',
        resourceId: userId,
        after: dto as any,
      },
    });

    return this.toPublicUser(userId);
  }

  // ---------- Change Password ----------

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new Error('INVALID_CREDENTIALS');
    const newHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    // revoga todas sessões exceto a atual? Por segurança revoga todas
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'user.change_password',
        resourceType: 'user',
        resourceId: userId,
      },
    });
  }

  // ---------- Forgot / Reset ----------

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ resetToken?: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    // sempre retorna ok para não enumerar usuários
    if (!user) return { resetToken: undefined };

    const rawToken = randomUUID();
    const tokenHash = await argon2.hash(rawToken, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    this.logger.log(
      `Password reset token for ${email}: ${rawToken} (expires ${expiresAt.toISOString()})`,
    );

    // em dev, retorna token para facilitar testes; em prod, enviar por email
    const isDev =
      (this.config.get<string>('NODE_ENV') ?? 'development') !== 'production';
    return isDev ? { resetToken: rawToken } : {};
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let matched: { id: string; userId: string } | null = null;
    for (const t of tokens) {
      if (await argon2.verify(t.tokenHash, dto.token)) {
        matched = t;
        break;
      }
    }
    if (!matched) throw new Error('INVALID_RESET_TOKEN');

    const newHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: matched.userId },
        data: { passwordHash: newHash },
      });
      await tx.passwordResetToken.update({
        where: { id: matched.id },
        data: { usedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId: matched.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: matched.userId,
          action: 'user.reset_password',
          resourceType: 'user',
          resourceId: matched.userId,
        },
      });
    });
  }

  // ---------- Helpers ----------

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const jti = randomUUID();
    const payload: JwtPayload = { sub: userId, jti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ??
          '15m') as never,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_TTL') ??
          '30d') as never,
      }),
    ]);

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
    // suporta "15m", "1h", "7d", "30d"
    const m = ttl.match(/^(\d+)([mhd])$/);
    if (!m) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const n = Number(m[1]);
    const unit = m[2];
    const ms =
      unit === 'm'
        ? n * 60 * 1000
        : unit === 'h'
          ? n * 60 * 60 * 1000
          : n * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }

  private async toPublicUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, roles: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      headline: user.profile?.headline ?? null,
      timezone: user.profile?.timezone ?? 'America/Sao_Paulo',
      status: user.status,
      roles: user.roles.map((r) => r.role),
      careerGoal: user.profile?.careerGoal ?? null,
      learningStyle: user.profile?.learningStyle ?? null,
      createdAt: user.createdAt,
    };
  }
}
