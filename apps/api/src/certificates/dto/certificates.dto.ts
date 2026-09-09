import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty({ description: 'ID do curso/trilha completada' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Tipo de certificado' })
  @IsString()
  type: string; // course, trail, hackathon, project

  @ApiPropertyOptional({ description: 'ID do projeto (se aplicável)' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'ID do hackathon (se aplicável)' })
  @IsOptional()
  @IsString()
  hackathonId?: string;
}

export class VerifyCertificateDto {
  @ApiProperty({ description: 'Serial do certificado' })
  @IsString()
  serial: string;
}
