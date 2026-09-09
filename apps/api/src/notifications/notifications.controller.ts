import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdatePreferencesDto, MarkReadDto } from './dto/notifications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ---------- List ----------

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  async list(
    @CurrentUser() user: { userId: string },
    @Param('limit') limit?: string,
  ) {
    return this.notificationsService.list(user.userId, {
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ---------- Unread Count ----------

  @Get('unread-count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  async unreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.notificationsService.unreadCount(user.userId);
    return { count };
  }

  // ---------- Mark Read ----------

  @Patch(':notificationId/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  async markRead(
    @CurrentUser() user: { userId: string },
    @Param('notificationId') notificationId: string,
  ) {
    await this.notificationsService.markRead(user.userId, notificationId);
    return { ok: true };
  }

  // ---------- Mark All Read ----------

  @Patch('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  async markAllRead(@CurrentUser() user: { userId: string }) {
    await this.notificationsService.markAllRead(user.userId);
    return { ok: true };
  }

  // ---------- Preferences ----------

  @Get('preferences')
  @ApiOperation({ summary: 'Obter preferências de notificação' })
  async getPreferences(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.getPreferences(user.userId);
  }

  @Post('preferences')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar preferência de notificação' })
  async updatePreference(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreference(user.userId, dto);
  }
}
