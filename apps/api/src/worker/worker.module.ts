import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaguesModule } from '../leagues/leagues.module';
import { XpModule } from '../xp/xp.module';
import { WorkerJobs } from './worker.jobs';
import { DatabaseBackupJob } from './database-backup.job';

@Module({
  imports: [ScheduleModule.forRoot(), LeaguesModule, XpModule],
  providers: [WorkerJobs, DatabaseBackupJob],
})
export class WorkerModule {}
