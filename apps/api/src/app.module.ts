import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { XpModule } from './xp/xp.module';
import { ContentModule } from './content/content.module';
import { ProgressModule } from './progress/progress.module';
import { LeaguesModule } from './leagues/leagues.module';
import { LibraryModule } from './library/library.module';
import { HackathonsModule } from './hackathons/hackathons.module';
import { JobsModule } from './jobs/jobs.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    XpModule,
    ContentModule,
    ProgressModule,
    LeaguesModule,
    LibraryModule,
    HackathonsModule,
    JobsModule,
    RealtimeModule,
    WorkerModule,
  ],
})
export class AppModule {}
