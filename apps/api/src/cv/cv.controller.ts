import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

class ExtractCvFileDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(100)
  mime!: string;

  @IsString()
  base64!: string;
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

  @Post('extract')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Extrair texto de um arquivo (PDF, Word, TXT / CTPS, diploma)',
  })
  extract(
    @CurrentUser() user: { userId: string },
    @Body() dto: ExtractCvFileDto,
  ) {
    return this.cv.extractText(dto.filename, dto.mime, dto.base64);
  }
}
