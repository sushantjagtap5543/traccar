const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');
const cron = require('node-cron');
const { pool, logger } = require('./db');
const googleDriveService = require('./googleDriveService');
const nodemailer = require('nodemailer');

const BACKUP_DIR = path.join(__dirname, '../../backups');

class BackupService {
    constructor() {
        this.currentTask = null;
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    startCron() {
        // Run every minute to check if it's backup time
        cron.schedule('* * * * *', async () => {
            const settings = await this.getSettings();
            if (settings.backup_enabled !== 'true') return;

            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            if (currentTime === settings.backup_time) {
                logger.info('Scheduled daily backup triggered.');
                this.runFullBackup();
            }
        });

        // Run retention cleanup daily at 01:00
        cron.schedule('0 1 * * *', () => {
            this.cleanupOldBackups();
        });
    }

    async getSettings() {
        const res = await pool.query('SELECT key, value FROM geosurepath_settings WHERE key LIKE \'backup_%\' OR key LIKE \'google_%\'');
        const settings = {};
        res.rows.forEach(r => settings[r.key] = r.value);
        return settings;
    }

    async runFullBackup(manual = false) {
        if (this.currentTask) {
            if (manual) throw new Error('A backup task is already running.');
            return;
        }

        this.currentTask = 'BACKUP_' + Date.now();
        const settings = await this.getSettings();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `full_backup_${timestamp}`;
        const localPath = path.join(BACKUP_DIR, backupName + '.zip');
        const encryptedPath = localPath + '.enc';

        try {
            // 1. Database Dump
            const dbDumpPath = path.join(BACKUP_DIR, `db_${timestamp}.sql`);
            await this.dumpDatabase(dbDumpPath);

            // 2. Create Archive
            await this.createArchive(localPath, [
                { path: dbDumpPath, name: 'database.sql' },
                { path: path.join(__dirname, '../../'), name: 'platform', exclude: ['node_modules', 'backups', '.git', '.github'] }
            ]);

            // 3. Encrypt
            await this.encryptFile(localPath, encryptedPath, settings.backup_encryption_key);

            // 4. Save to DB
            const stats = fs.statSync(encryptedPath);
            await pool.query(
                'INSERT INTO geosurepath_backups (filename, size, storage_type, status) VALUES ($1, $2, $3, $4)',
                [backupName + '.zip.enc', stats.size, 'local', 'success']
            );

            // 5. Cloud Upload
            if (settings.google_drive_enabled === 'true') {
                try {
                    await googleDriveService.init(settings.google_drive_client_id, settings.google_drive_client_secret, settings.google_drive_refresh_token);
                    await googleDriveService.uploadFile(encryptedPath, backupName + '.zip.enc');
                    await pool.query('UPDATE geosurepath_backups SET storage_type = $1 WHERE filename = $2', ['both', backupName + '.zip.enc']);
                } catch (err) {
                    logger.error('Scheduled backup cloud upload failed:', err.message);
                }
            }

            // Cleanup temp files
            await fs.remove(dbDumpPath);
            await fs.remove(localPath);

            logger.info(`Full backup completed: ${backupName}`);
            await this.sendNotification('Backup Successful', `Backup ${backupName} has been created and stored successfully.`);

        } catch (err) {
            logger.error('Full backup failed:', err);
            await pool.query(
                'INSERT INTO geosurepath_backups (filename, size, storage_type, status, error_message) VALUES ($1, $2, $3, $4, $5)',
                [backupName + '.zip.enc', '0', 'none', 'failed', err.message]
            );
            await this.sendNotification('Backup Failed', `Error: ${err.message}`);
        } finally {
            this.currentTask = null;
        }
    }

    async dumpDatabase(outputPath) {
        return new Promise((resolve, reject) => {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) return reject(new Error('DATABASE_URL not set'));
            
            // For Postgres
            const cmd = `pg_dump "${dbUrl}" -f "${outputPath}"`;
            exec(cmd, (error, stdout, stderr) => {
                if (error) reject(new Error(stderr || error.message));
                else resolve();
            });
        });
    }

    async createArchive(outputPath, items) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);

            for (const item of items) {
                if (fs.statSync(item.path).isDirectory()) {
                    archive.directory(item.path, item.name, (data) => {
                        if (item.exclude && item.exclude.some(ex => data.name.includes(ex))) return false;
                        return data;
                    });
                } else {
                    archive.file(item.path, { name: item.name });
                }
            }

            archive.finalize();
        });
    }

    async encryptFile(inputPath, outputPath, key) {
        return new Promise((resolve, reject) => {
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), crypto.randomBytes(16).fill(0)); // Static IV for simplicity in restore, or store it
            // Better to use random IV and prepend it
            const iv = crypto.randomBytes(16);
            const cipher2 = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);

            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            output.write(iv);
            input.pipe(cipher2).pipe(output);

            output.on('finish', () => resolve());
            output.on('error', (err) => reject(err));
        });
    }

    async cleanupOldBackups() {
        const settings = await this.getSettings();
        const days = parseInt(settings.backup_retention_days) || 15;
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - days);

        try {
            const res = await pool.query('SELECT * FROM geosurepath_backups WHERE created_at < $1', [threshold]);
            for (const row of res.rows) {
                const filePath = path.join(BACKUP_DIR, row.filename);
                if (fs.existsSync(filePath)) {
                    await fs.remove(filePath);
                }
                // Also delete from GDrive if possible...
                
                await pool.query('DELETE FROM geosurepath_backups WHERE id = $1', [row.id]);
                logger.info(`Cleanup: Deleted old backup ${row.filename}`);
            }
        } catch (err) {
            logger.error('Cleanup failed:', err);
        }
    }

    async sendNotification(subject, message) {
        // Implementation for email/dashboard notification
        const settings = await pool.query('SELECT value FROM geosurepath_settings WHERE key = \'alert_webhook\' LIMIT 1');
        if (settings.rowCount > 0 && settings.rows[0].value) {
            const axios = require('axios');
            try {
                await axios.post(settings.rows[0].value, { content: `**BACKUP NOTIFY**: ${subject}\n${message}` });
            } catch (err) {
                logger.error('Webhook notification failed:', err.message);
            }
        }
    }
}

module.exports = new BackupService();
