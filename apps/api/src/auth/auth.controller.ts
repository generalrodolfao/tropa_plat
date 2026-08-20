import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.auth.register(dto);
    } catch (e) {
      if (e instanceof Error && e.message === 'EMAIL_IN_USE') {
        throw new ConflictException('Email já cadastrado');
      }
      throw e;
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.auth.login(dto);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      throw e;
    }
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    try {
      return await this.auth.refresh(dto);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_REFRESH_TOKEN') {
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }
      throw e;
    }
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: { userId: string }) {
    return this.auth.me(user.userId);
  }
}
