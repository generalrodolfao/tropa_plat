import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { B2BService } from './b2b.service';
import { InviteMemberDto, EngagementReportDto } from './dto/b2b.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('B2B')
@Controller('b2b')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class B2BController {
  constructor(private readonly b2bService: B2BService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard da empresa (admin)' })
  async getCompanyDashboard(@CurrentUser() user: { userId: string }) {
    return this.b2bService.getCompanyDashboard(user.userId);
  }

  @Get('members/:memberId/progress')
  @ApiOperation({ summary: 'Progresso de um membro da equipe' })
  async getMemberProgress(
    @CurrentUser() user: { userId: string },
    @Param('memberId') memberId: string,
  ) {
    return this.b2bService.getMemberProgress(user.userId, memberId);
  }

  @Post('reports/engagement')
  @HttpCode(200)
  @ApiOperation({ summary: 'Relatório de engajamento da equipe' })
  async getEngagementReport(
    @CurrentUser() user: { userId: string },
    @Body() dto: EngagementReportDto,
  ) {
    return this.b2bService.getEngagementReport(user.userId, dto);
  }
}
