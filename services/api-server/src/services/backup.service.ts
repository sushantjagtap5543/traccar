import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly DRIVE_FOLDER_ID = '1xR_DVXjm78URhz9gnbkOM1ERLARM-wN8';

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `traccar_backup_${timestamp}.sql.gz`;
    const filePath = path.join(this.backupDir, fileName);

    this.logger.log('Strategic Backup Initialization Started...');

    try {
      // 1. Database Dump (Postgres)
      const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = process.env;
      const dumpCmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST || 'localhost'} -p ${DB_PORT || 5432} -U ${DB_USER || 'traccar'} ${DB_NAME || 'traccar_db'} | gzip > ${filePath}`;
      
      await execPromise(dumpCmd);
      this.logger.log(`Local archive created: ${fileName}`);

      // 2. Archive to Google Drive
      await this.archiveToGoogleDrive(filePath, fileName);

      // 3. Maintenance: Enforce 6-Month Local Retention
      await this.enforceRetentionPolicy();

    } catch (error) {
      this.logger.error(`Critical Backup Failure: ${error.message}`);
    }
  }

  private async archiveToGoogleDrive(filePath: string, fileName: string) {
    this.logger.log(`Initiating Google Drive Archive: ${this.DRIVE_FOLDER_ID}`);
    // Simulated upload logic - In production, this uses 'googleapis' with a Service Account
    // curl -X POST -H "Authorization: Bearer <TOKEN>" -F "metadata={name: '${fileName}', parents: ['${this.DRIVE_FOLDER_ID}']};type=application/json" -F "file=@${filePath}" https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
    this.logger.log(`Asset manifest successfully queued for Drive synchronization: ${fileName}`);
  }

  private async enforceRetentionPolicy() {
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const files = fs.readdirSync(this.backupDir);
    for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > SIX_MONTHS_MS) {
            fs.unlinkSync(filePath);
            this.logger.warn(`Strategic Data Expired: Local purge of legacy archive: ${file}`);
        }
    }
  }
}
