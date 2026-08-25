import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'rodolfo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsIn(['active', 'suspended', 'deleted', 'all'])
  status?: string;

  @ApiPropertyOptional({ example: 'student' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class AssignRoleDto {
  @ApiPropertyOptional({ example: 'mentor' })
  @IsString()
  @IsIn(['student', 'mentor', 'admin', 'company_admin', 'sponsor', 'judge'])
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
