import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssueCertificateDto } from './dto/certificates.dto';
import { FileTextService } from '../common/file-text.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileText: FileTextService,
  ) {}

  // ---------- Generate serial number ----------

  private generateSerial(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TD-${timestamp}-${random}`;
  }

  // ---------- Issue certificate ----------

  async issueCertificate(userId: string, dto: IssueCertificateDto) {
    // Check if already issued
    const existing = await this.prisma.certificate.findFirst({
      where: {
        userId,
        referenceId: dto.courseId,
        type: dto.type,
      },
    });

    if (existing) {
      return {
        ok: true,
        certificateId: existing.id,
        serial: existing.serial,
        alreadyExists: true,
      };
    }

    // Get course details
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Generate serial
    const serial = this.generateSerial();
    const verifyUrl = `/certificates/verify/${serial}`;

    // Create certificate
    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        type: dto.type,
        referenceId: dto.courseId,
        title: course.title,
        serial,
        verifyUrl,
        issuedAt: new Date(),
      },
    });

    return {
      ok: true,
      certificateId: certificate.id,
      serial,
      verifyUrl,
      studentName: user.name,
      courseName: course.title,
      issuedAt: certificate.issuedAt,
    };
  }

  // ---------- Verify certificate ----------

  async verifyCertificate(serial: string) {
    const certificate = await this.prisma.certificate.findFirst({
      where: { serial },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado não encontrado');
    }

    return {
      valid: certificate.status === 'issued',
      certificate: {
        serial: certificate.serial,
        studentName: certificate.user.name,
        title: certificate.title,
        type: certificate.type,
        hours: certificate.hours,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
      },
    };
  }

  // ---------- Get user certificates ----------

  async getUserCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ---------- Get certificate details ----------

  async getCertificateDetails(certificateId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado não encontrado');
    }

    return {
      id: certificate.id,
      serial: certificate.serial,
      studentName: certificate.user.name,
      title: certificate.title,
      type: certificate.type,
      hours: certificate.hours,
      issuedAt: certificate.issuedAt,
      verifyUrl: certificate.verifyUrl,
      status: certificate.status,
    };
  }

  // ---------- Revoke certificate ----------

  async revokeCertificate(userId: string, certificateId: string) {
    // Check if user is admin
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const isAdmin = userRoles.some((r) => r.role === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Apenas admins podem revogar certificados');
    }

    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificado não encontrado');
    }

    await this.prisma.certificate.update({
      where: { id: certificateId },
      data: { status: 'revoked' },
    });

    return { ok: true };
  }

  // ---------- Upload de certificado externo (diploma, curso, etc.) ----------

  async uploadExternal(
    userId: string,
    dto: { filename: string; mime: string; base64: string },
  ) {
    // Valida formato/tamanho/mime. O texto pode vir vazio em PDFs escaneados,
    // mas o arquivo ainda é útil para centralizar/baixar depois.
    await this.fileText.extractText(dto.filename, dto.mime, dto.base64);

    const buffer = Buffer.from(dto.base64, 'base64');
    if (buffer.length > 6 * 1024 * 1024) {
      throw new BadRequestException('Certificado deve ter no máximo 6MB.');
    }
    const pdfKey = `base64:${buffer.toString('base64')}`;

    const title = dto.filename
      .replace(/\.(pdf|doc|docx|txt)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    const serial = this.generateSerial();
    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        type: 'external',
        referenceId: null,
        title: title || 'Certificado externo',
        hours: 0,
        serial,
        verifyUrl: `/certificates/verify/${serial}`,
        pdfKey,
      },
    });

    return {
      ok: true,
      certificateId: certificate.id,
      serial,
      title: certificate.title,
    };
  }

  // ---------- Geração de PDF (pdfkit) ----------

  async generatePdf(certificateId: string, userId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { user: { select: { name: true } } },
    });

    if (!certificate) throw new NotFoundException('Certificado não encontrado');
    if (certificate.userId !== userId) {
      throw new ForbiddenException('Certificado não pertence a este usuário');
    }

    // Certificado externo → devolve o PDF original
    if (certificate.pdfKey?.startsWith('base64:')) {
      return {
        buffer: Buffer.from(
          certificate.pdfKey.slice('base64:'.length),
          'base64',
        ),
        filename: `${certificate.serial}.pdf`,
        mime: 'application/pdf',
      };
    }

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 48,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const issued = new Date(certificate.issuedAt).toLocaleDateString('pt-BR');
    const name = certificate.user.name ?? 'Aluno';

    // Moldura
    doc
      .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
      .lineWidth(2)
      .strokeColor('#e2e8f0')
      .stroke();
    doc
      .rect(28, 28, doc.page.width - 56, doc.page.height - 56)
      .lineWidth(0.5)
      .strokeColor('#cbd5e1')
      .stroke();

    // Cabeçalho
    doc
      .fontSize(11)
      .fillColor('#475569')
      .font('Helvetica')
      .text('TROPA DOS DADOS', 0, 52, {
        align: 'center',
        width: doc.page.width,
      });
    doc.moveDown(1);

    doc
      .fontSize(26)
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .text('CERTIFICADO', 0, 82, { align: 'center', width: doc.page.width });
    doc.moveDown(3);

    doc
      .fontSize(13)
      .fillColor('#334155')
      .font('Helvetica')
      .text('Certificamos que', 0, 150, {
        align: 'center',
        width: doc.page.width,
      });
    doc
      .fontSize(24)
      .fillColor('#166534')
      .font('Helvetica-Bold')
      .text(name, 0, 182, { align: 'center', width: doc.page.width });
    doc
      .fontSize(13)
      .fillColor('#334155')
      .font('Helvetica')
      .text('concluiu com êxito', 0, 224, {
        align: 'center',
        width: doc.page.width,
      });
    doc
      .fontSize(18)
      .fillColor('#0f172a')
      .font('Helvetica-Bold')
      .text(certificate.title, 0, 250, {
        align: 'center',
        width: doc.page.width,
      });
    doc
      .fontSize(13)
      .fillColor('#334155')
      .font('Helvetica')
      .text(
        certificate.hours > 0
          ? `Carga horária: ${certificate.hours}h`
          : 'Curso complementar',
        0,
        300,
        { align: 'center', width: doc.page.width },
      );

    doc.moveDown(4);
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#64748b')
      .text(
        `Emitido em ${issued} · Código de validação: ${certificate.serial}`,
        0,
        420,
        { align: 'center', width: doc.page.width },
      );

    doc.end();
    const buffer = await done;

    return {
      buffer,
      filename: `${certificate.serial}.pdf`,
      mime: 'application/pdf',
    };
  }
}
