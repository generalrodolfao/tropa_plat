import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssueCertificateDto } from './dto/certificates.dto';
import { createHash } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
