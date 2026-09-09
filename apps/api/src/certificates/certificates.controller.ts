import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/certificates.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

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
  async verifyCertificate(
    @Param('serial') serial: string,
  ) {
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

  @Post(':certificateId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revogar certificado (admin)' })
  async revokeCertificate(
    @CurrentUser() user: { userId: string },
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificatesService.revokeCertificate(user.userId, certificateId);
  }
}
