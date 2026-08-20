import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaguesModule } from '../leagues/leagues.module';
import { XpModule } from '../xp/xp.module';
import { WorkerJobs } from './worker.jobs';

@Module({
  imports: [ScheduleModule.forRoot(), LeaguesModule, XpModule],
  providers: [WorkerJobs],
})
export class WorkerModule {}
