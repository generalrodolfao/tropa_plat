import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import {
  CvParseDto,
  CvReviewDto,
  GeneratePdiDto,
  GenerateQuizItemsDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('AI')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('cv/parse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Extrair dados estruturados do CV via IA' })
  async parseCV(@Body() dto: CvParseDto) {
    return this.aiService.parseCV(dto);
  }

  @Post('cv/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revisar CV com feedback da IA' })
  async reviewCV(@Body() dto: CvReviewDto) {
    return this.aiService.reviewCV(dto);
  }

  @Post('pdi/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Gerar PDI personalizado via IA' })
  async generatePDI(@Body() dto: GeneratePdiDto) {
    return this.aiService.generatePDI(dto);
  }

  @Post('quiz/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Gerar itens de quiz via IA (admin)' })
  async generateQuizItems(@Body() dto: GenerateQuizItemsDto) {
    return this.aiService.generateQuizItems(dto);
  }
}
