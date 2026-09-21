import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

export const GAME_SSO_AUDIENCE = 'vale-dos-dados';

@Injectable()
export class GameService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gera o link de entrada no jogo: URL pública do game com um token SSO
   * curto (5min) que o jogo troca por uma sessão local. O token é emitido
   * com o segredo compartilhado GAME_SSO_SECRET e audience "vale-dos-dados".
   */
  async createSsoLink(userId: string): Promise<{ url: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    const secret = this.config.getOrThrow<string>('GAME_SSO_SECRET');
    const gameUrl = this.config.getOrThrow<string>('GAME_URL');

    const jti = randomUUID();
    const token = await this.jwt.signAsync(
      { sub: userId, email: user.email, name: user.name, jti },
      { secret, audience: GAME_SSO_AUDIENCE, expiresIn: '5m' as never },
    );

    const base = gameUrl.replace(/\/+$/, '');
    return { url: `${base}/?sso=${encodeURIComponent(token)}` };
  }
}
