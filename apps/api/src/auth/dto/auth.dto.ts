import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'rodolfo@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Rodolfo' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'senha-segura' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'rodolfo@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
