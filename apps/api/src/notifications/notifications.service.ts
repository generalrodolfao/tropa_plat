import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationDto,
  UpdatePreferencesDto,
} from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------- Create Notification ----------

  async create(dto: CreateNotificationDto): Promise<any> {
    // Verificar preferências do usuário
    const pref = await this.prisma.notificationPref.findUnique({
      where: {
        userId_category_channel: {
          userId: dto.userId,
          category: dto.type,
          channel: 'in_app',
        },
      },
    });

    // Se preferência está desabilitada, não criar
    if (pref && !pref.enabled) {
      this.logger.debug(
        `Notification blocked by preference: ${dto.userId} / ${dto.type}`,
      );
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: 'in_app',
        title: dto.title,
        body: dto.body,
        data: dto.data as any,
      },
    });

    // Broadcast via Socket.IO (se disponível)
    this.broadcastToUser(dto.userId, notification);

    return notification;
  }

  // ---------- List Notifications ----------

  async list(
    userId: string,
    params?: { limit?: number; unreadOnly?: boolean },
  ) {
    const limit = params?.limit ?? 20;
    const where: any = { userId };
    if (params?.unreadOnly) {
      where.readAt = null;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  // ---------- Unread Count ----------

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  // ---------- Mark as Read ----------

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  // ---------- Mark All as Read ----------

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // ---------- Preferences ----------

  async getPreferences(userId: string) {
    return this.prisma.notificationPref.findMany({
      where: { userId },
    });
  }

  async updatePreference(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.notificationPref.upsert({
      where: {
        userId_category_channel: {
          userId,
          category: dto.category,
          channel: dto.channel,
        },
      },
      create: {
        userId,
        category: dto.category,
        channel: dto.channel,
        enabled: dto.enabled,
      },
      update: {
        enabled: dto.enabled,
      },
    });
  }

  // ---------- Broadcast (Socket.IO) ----------

  private broadcastToUser(userId: string, notification: any) {
    try {
      // Socket.IO será injetado via gateway
      // Por enquanto, apenas log
      this.logger.debug(
        `Broadcasting notification to user ${userId}: ${notification.title}`,
      );
    } catch (error) {
      this.logger.warn(`Failed to broadcast notification: ${error}`);
    }
  }

  // ---------- Helper: Create common notifications ----------

  async notifyBadgeEarned(userId: string, badgeName: string) {
    return this.create({
      userId,
      type: 'badge_earned',
      title: 'Nova conquista!',
      body: `Você ganhou a badge "${badgeName}"`,
    });
  }

  async notifyXpEarned(userId: string, amount: number, reason: string) {
    return this.create({
      userId,
      type: 'xp_earned',
      title: `+${amount} XP`,
      body: reason,
    });
  }

  async notifyLevelUp(userId: string, newLevel: string) {
    return this.create({
      userId,
      type: 'level_up',
      title: 'Patente subiu!',
      body: `Você foi promovido para ${newLevel}`,
    });
  }

  async notifyHackathonResult(
    userId: string,
    hackathonTitle: string,
    position: number,
  ) {
    return this.create({
      userId,
      type: 'hackathon_result',
      title: 'Resultado do hackathon',
      body: `Seu time ficou em ${position}º lugar no "${hackathonTitle}"`,
    });
  }

  async notifySubscriptionExpiring(userId: string, daysLeft: number) {
    return this.create({
      userId,
      type: 'subscription_expiring',
      title: 'Assinatura expirando',
      body: `Sua assinatura expira em ${daysLeft} dias.`,
    });
  }
}
