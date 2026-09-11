import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Backup lógico diário do Postgres.
 * Roda no serviço api (sempre ativo), usa a rede interna do Railway
 * (DATABASE_URL) e grava os dumps comprimidos em BACKUP_DIR (volume persistente).
 */
@Injectable()
export class DatabaseBackupJob {
  private readonly logger = new Logger(DatabaseBackupJob.name);
  private readonly dir = process.env.BACKUP_DIR ?? '/backups';
  private readonly retentionDays = Number(
    process.env.BACKUP_RETENTION_DAYS ?? 14,
  );

  /** Diário 03:00 UTC. */
  @Cron('0 3 * * *', { name: 'database-backup' })
  async dailyBackup() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      this.logger.warn('[backup] DATABASE_URL ausente; backup ignorado.');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const out = join(this.dir, `tropa-${stamp}.sql.gz`);
    const cleanUrl = url.split('?')[0];

    try {
      await mkdir(this.dir, { recursive: true });
      // pipefail garante que uma falha do pg_dump não seja mascarada pelo gzip
      await execAsync(
        `set -o pipefail; pg_dump "$BACKUP_DB_URL" | gzip > "${out}"`,
        {
          env: { ...process.env, BACKUP_DB_URL: cleanUrl },
          shell: '/bin/bash',
          timeout: 30 * 60 * 1000,
        },
      );

      const { size } = await stat(out);
      if (size < 100) throw new Error(`arquivo suspeito (${size} bytes)`);

      this.logger.log(`[backup] OK: ${out} (${Math.round(size / 1024)} KB)`);
      await this.prune();
    } catch (err) {
      this.logger.error(`[backup] falhou: ${(err as Error).message}`);
    }
  }

  private async prune() {
    let files: string[];
    try {
      files = await readdir(this.dir);
    } catch {
      return;
    }

    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    for (const file of files) {
      if (!file.startsWith('tropa-') || !file.endsWith('.sql.gz')) continue;
      const full = join(this.dir, file);
      const info = await stat(full);
      if (info.mtimeMs < cutoff) {
        await unlink(full);
        this.logger.log(`[backup] retenção: removido ${file}`);
      }
    }
  }
}
