import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CvService } from './cv.service';
import type { SaveCvReview } from './cv.service';

class SaveCvDto {
  @IsString()
  @MinLength(50)
  text!: string;

  @IsOptional()
  @IsObject()
  parsed?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  review?: SaveCvReview;
}

@ApiTags('cv')
@Controller('cv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CvController {
  constructor(private readonly cv: CvService) {}

  @Get()
  @ApiOperation({ summary: 'Obter CV atual + revisão' })
  getCurrent(@CurrentUser() user: { userId: string }) {
    return this.cv.getCurrent(user.userId);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Salvar CV (texto, dados extraídos e revisão)' })
  save(@CurrentUser() user: { userId: string }, @Body() dto: SaveCvDto) {
    return this.cv.save(user.userId, dto);
  }
}
