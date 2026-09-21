import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/certificates.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString, MaxLength } from 'class-validator';

class UploadCertificateDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(100)
  mime!: string;

  @IsString()
  base64!: string;
}

@ApiTags('Certificados')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('issue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Emitir certificado automaticamente' })
  async issueCertificate(
    @CurrentUser() user: { userId: string },
    @Body() dto: IssueCertificateDto,
  ) {
    return this.certificatesService.issueCertificate(user.userId, dto);
  }

  @Get('verify/:serial')
  @ApiOperation({ summary: 'Verificar autenticidade do certificado' })
  async verifyCertificate(@Param('serial') serial: string) {
    return this.certificatesService.verifyCertificate(serial);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus certificados' })
  async getUserCertificates(@CurrentUser() user: { userId: string }) {
    return this.certificatesService.getUserCertificates(user.userId);
  }

  @Get(':certificateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes do certificado' })
  async getCertificateDetails(@Param('certificateId') certificateId: string) {
    return this.certificatesService.getCertificateDetails(certificateId);
  }

  @Get(':certificateId/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Baixar certificado em PDF' })
  async getCertificatePdf(
    @CurrentUser() user: { userId: string },
    @Param('certificateId') certificateId: string,
    @Res() res: FastifyReply,
  ) {
    const pdf = await this.certificatesService.generatePdf(
      certificateId,
      user.userId,
    );
    res
      .type(pdf.mime)
      .header('Content-Disposition', `attachment; filename="${pdf.filename}"`)
      .send(pdf.buffer);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Enviar certificado externo (diploma, curso...) em PDF',
  })
  async uploadCertificate(
    @CurrentUser() user: { userId: string },
    @Body() dto: UploadCertificateDto,
  ) {
    return this.certificatesService.uploadExternal(user.userId, dto);
  }

  @Post(':certificateId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revogar certificado (admin)' })
  async revokeCertificate(
    @CurrentUser() user: { userId: string },
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificatesService.revokeCertificate(
      user.userId,
      certificateId,
    );
  }
}
