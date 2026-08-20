import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LibraryService } from './library.service';

class ProgressDto {
  @IsString()
  ebookId!: string;

  @IsInt()
  @Min(0)
  readPages!: number;
}

@ApiTags('biblioteca')
@Controller('library')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.library.list(user.userId);
  }

  @Get('ebooks/:slug')
  getEbook(
    @CurrentUser() user: { userId: string },
    @Param('slug') slug: string,
  ) {
    return this.library.getBySlug(user.userId, slug);
  }

  @Post('progress')
  updateProgress(
    @CurrentUser() user: { userId: string },
    @Body() body: ProgressDto,
  ) {
    return this.library.updateProgress(
      user.userId,
      body.ebookId,
      body.readPages,
    );
  }

  @Get('certificates')
  certificates(@CurrentUser() user: { userId: string }) {
    return this.library.listCertificates(user.userId);
  }
}
