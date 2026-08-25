import {
  Body,
  ConflictException,
  Controller,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
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
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastro de usuário' })
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
  @ApiOperation({ summary: 'Login com email e senha' })
  async login(@Body() dto: LoginDto) {
    try {
      return await this.auth.login(dto);
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      if (e instanceof Error && e.message === 'ACCOUNT_SUSPENDED') {
        throw new ForbiddenException('Conta suspensa. Entre em contato com o suporte.');
      }
      if (e instanceof Error && e.message === 'ACCOUNT_DELETED') {
        throw new ForbiddenException('Conta desativada');
      }
      throw e;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar access token via refresh token' })
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
  @ApiOperation({ summary: 'Revogar refresh token (logout de um dispositivo)' })
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto);
    return { ok: true };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar todas as sessões do usuário' })
  async logoutAll(@CurrentUser() user: { userId: string }) {
    await this.auth.logoutAll(user.userId);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  async me(@CurrentUser() user: { userId: string }) {
    try {
      return await this.auth.me(user.userId);
    } catch (e) {
      if (e instanceof Error && e.message === 'USER_NOT_FOUND') throw new NotFoundException('Usuário não encontrado');
      throw e;
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
  async updateMe(@CurrentUser() user: { userId: string }, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(user.userId, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trocar senha (requer senha atual)' })
  async changePassword(@CurrentUser() user: { userId: string }, @Body() dto: ChangePasswordDto) {
    try {
      await this.auth.changePassword(user.userId, dto);
      return { ok: true };
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
        throw new BadRequestException('Senha atual incorreta');
      }
      throw e;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar reset de senha (envia token por email)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.auth.forgotPassword(dto);
    // em dev retornamos token para facilitar testes; em prod só mensagem genérica
    return {
      ok: true,
      message: 'Se o email existir, enviaremos instruções de redefinição.',
      ...(result.resetToken ? { resetToken: result.resetToken } : {}),
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha com token recebido por email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      await this.auth.resetPassword(dto);
      return { ok: true };
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_RESET_TOKEN') {
        throw new BadRequestException('Token inválido ou expirado');
      }
      throw e;
    }
  }
}
