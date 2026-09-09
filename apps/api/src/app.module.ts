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
import { TrailModule } from './trails/trail.module';
import { UsersModule } from './users/users.module';
import { HackathonsModule } from './hackathons/hackathons.module';
import { JobsModule } from './jobs/jobs.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WorkerModule } from './worker/worker.module';
import { PaymentsModule } from './payments/payments.module';
import { VideoModule } from './video/video.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AIModule } from './ai/ai.module';
import { PDIModule } from './pdi/pdi.module';
import { ProjectsModule } from './projects/projects.module';
import { B2BModule } from './b2b/b2b.module';
import { CertificatesModule } from './certificates/certificates.module';

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
    TrailModule,
    UsersModule,
    HackathonsModule,
    JobsModule,
    RealtimeModule,
    WorkerModule,
    PaymentsModule,
    VideoModule,
    QuizzesModule,
    NotificationsModule,
    AIModule,
    PDIModule,
    ProjectsModule,
    B2BModule,
    CertificatesModule,
  ],
})
export class AppModule {}
