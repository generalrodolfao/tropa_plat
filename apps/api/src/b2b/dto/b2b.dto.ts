import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: 'Email do membro a convidar' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ description: 'Cargo/função do membro' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateSeatDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Novo número de assentos' })
  @IsNumber()
  @Min(1)
  @Max(1000)
  seats: number;
}

export class EngagementReportDto {
  @ApiProperty({ description: 'Data início (ISO)' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Data fim (ISO)' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: 'IDs dos membros (opcional)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
