import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { AssignRoleDto, ListUsersDto, UpdateUserDto } from './dto/users.dto';

/**
 * Alias administrativo de /users para os painéis do frontend (/admin/users).
 */
@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários (admin)' })
  list(@Query() query: ListUsersDto) {
    return this.users.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de usuários (admin)' })
  stats() {
    return this.users.stats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário (admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: { userId: string },
  ) {
    return this.users.update(id, dto, actor.userId);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Atribuir papel a usuário (admin)' })
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: { userId: string },
  ) {
    return this.users.assignRole(
      id,
      dto.role,
      dto.organizationId,
      actor.userId,
    );
  }

  @Delete(':id/roles/:role')
  @ApiOperation({ summary: 'Remover papel de usuário (admin)' })
  removeRole(
    @Param('id') id: string,
    @Param('role') role: string,
    @CurrentUser() actor: { userId: string },
  ) {
    return this.users.removeRole(id, role, actor.userId);
  }
}
