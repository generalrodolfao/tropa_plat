import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListUsersDto, UpdateUserDto, AssignRoleDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar usuários (admin)' })
  async list(@Query() query: ListUsersDto) {
    return this.users.list(query);
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Estatísticas de usuários (admin)' })
  async stats() {
    return this.users.stats();
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Exportar meus dados (LGPD)' })
  async exportMe(@CurrentUser() user: { userId: string }) {
    return this.users.exportData(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter usuário por id (self ou admin)' })
  async getById(@Param('id') id: string, @CurrentUser() actor: { userId: string }) {
    // permite self ou admin; se não for self, verifica role admin dentro do service? Guard fica mais simples: tenta checar
    // Se id !== actor e não é admin, bloqueia
    if (id !== actor.userId) {
      // vai exigir admin role via verificação manual
      const caller = await this.users.getById(actor.userId);
      const isAdmin = (caller as any).roles.some((r: any) => r.role === 'admin');
      if (!isAdmin) throw new ForbiddenException('Acesso negado');
    }
    return this.users.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário (self ou admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: { userId: string },
  ) {
    // se não é self, só admin pode alterar status/email de outros
    if (id !== actor.userId) {
      const caller = await this.users.getById(actor.userId);
      const isAdmin = (caller as any).roles.some((r: any) => r.role === 'admin');
      if (!isAdmin) throw new ForbiddenException('Apenas admin pode editar outros usuários');
      // non-admin não pode alterar status de outros
    } else {
      // usuário comum não pode alterar próprio status para evitar privilege escalation
      if (dto.status) throw new ForbiddenException('Não é permitido alterar status do próprio usuário');
    }
    return this.users.update(id, dto, actor.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário (soft delete) - self ou admin' })
  async softDelete(@Param('id') id: string, @CurrentUser() actor: { userId: string }) {
    if (id !== actor.userId) {
      const caller = await this.users.getById(actor.userId);
      const isAdmin = (caller as any).roles.some((r: any) => r.role === 'admin');
      if (!isAdmin) throw new ForbiddenException('Apenas admin pode remover outros usuários');
    }
    return this.users.softDelete(id, actor.userId);
  }

  @Post(':id/roles')
  @Roles('admin')
  @ApiOperation({ summary: 'Atribuir papel a usuário (admin)' })
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: { userId: string },
  ) {
    return this.users.assignRole(id, dto.role, dto.organizationId, actor.userId);
  }

  @Delete(':id/roles/:role')
  @Roles('admin')
  @ApiOperation({ summary: 'Remover papel de usuário (admin)' })
  async removeRole(
    @Param('id') id: string,
    @Param('role') role: string,
    @CurrentUser() actor: { userId: string },
  ) {
    return this.users.removeRole(id, role, actor.userId);
  }

  @Get(':id/export')
  @Roles('admin')
  @ApiOperation({ summary: 'Exportar dados de usuário (LGPD - admin)' })
  async exportByAdmin(@Param('id') id: string) {
    return this.users.exportData(id);
  }
}
