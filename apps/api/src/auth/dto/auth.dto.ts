import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'rodolfo@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Rodolfo Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Str0ng!Pass2026' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'visual' })
  @IsOptional()
  @IsString()
  @IsIn(['visual', 'auditivo', 'leitura', 'pratico'])
  learningStyle?: string;

  @ApiPropertyOptional({ example: 'analista-dados' })
  @IsOptional()
  @IsString()
  careerGoal?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'rodolfo@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass2026' })
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token opaco (JWT)' })
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Rodolfo Silva' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.tropa/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Analista de Dados | SQL & Python' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/rodolfo' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/rodolfo' })
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'visual' })
  @IsOptional()
  @IsIn(['visual', 'auditivo', 'leitura', 'pratico'])
  learningStyle?: string;

  @ApiPropertyOptional({ example: 'analista-dados' })
  @IsOptional()
  @IsString()
  careerGoal?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'senha-antiga' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'nova-senha-forte' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'rodolfo@email.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-uuid-do-email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'nova-senha-forte' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
