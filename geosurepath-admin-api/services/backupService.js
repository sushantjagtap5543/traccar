const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');
const cron = require('node-cron');
const { pool, logger } = require('./db');
const googleDriveService = require('./googleDriveService');
const nodemailer = require('nodemailer');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

class BackupService {
    constructor() {
        this.currentTask = null;
        this.scheduledTasks = [];
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        try {
            fs.accessSync(BACKUP_DIR, fs.constants.W_OK);
            logger.info(`Backup Service initialized. Directory: ${BACKUP_DIR}`);
        } catch (err) {
            logger.error(`FATAL: Backup directory ${BACKUP_DIR} is not writable!`);
        }
    }

    startCron() {
        // Run every minute to check if it's backup time
        const checkTask = cron.schedule('* * * * *', async () => {
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
        const cleanupTask = cron.schedule('0 1 * * *', () => {
            this.cleanupOldBackups();
        });

        this.scheduledTasks.push(checkTask, cleanupTask);
    }

    stopCron() {
        this.scheduledTasks.forEach(task => task.stop());
        this.scheduledTasks = [];
        logger.info('Backup cron tasks stopped.');
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
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const backupName = `full_backup_${timestamp}_${randomSuffix}`;
        const localPath = path.join(BACKUP_DIR, backupName + '.zip');
        const encryptedPath = localPath + '.enc';

        try {
            // 1. Database Dump
            const dbDumpPath = path.join(BACKUP_DIR, `db_${timestamp}.sql`);
            await this.dumpDatabase(dbDumpPath);
            await this.validateDatabaseDump(dbDumpPath);

            // 2. Create Archive (Only include database. Source code excluded for security)
            await this.createArchive(localPath, [
                { path: dbDumpPath, name: 'database.sql' }
            ]);

            // 3. Encrypt
            await this.encryptFile(localPath, encryptedPath, settings.backup_encryption_key);

            // 4. Save to DB
            const stats = fs.statSync(encryptedPath);
            const checksum = await this.calculateChecksum(encryptedPath);
            await pool.query(
                'INSERT INTO geosurepath_backups (filename, size, storage_type, status, checksum) VALUES ($1, $2, $3, $4, $5)',
                [backupName + '.zip.enc', stats.size, 'local', 'success', checksum]
            );

            // 5. Cloud Upload
            if (settings.google_drive_enabled === 'true') {
                try {
                    await googleDriveService.init(settings.google_drive_client_id, settings.google_drive_client_secret, settings.google_drive_refresh_token);
                    const cloudFileId = await googleDriveService.uploadFile(encryptedPath, backupName + '.zip.enc');
                    await pool.query('UPDATE geosurepath_backups SET storage_type = $1, cloud_file_id = $2 WHERE filename = $3', ['both', cloudFileId, backupName + '.zip.enc']);
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

    async validateDatabaseDump(filePath) {
        if (!fs.existsSync(filePath)) throw new Error('Database dump file not found');
        const stats = fs.statSync(filePath);
        if (stats.size < 1024) throw new Error('Database dump file too small (possible failure)');
        
        // Check for SQL signature (e.g., PostgreSQL dump header)
        const header = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).slice(0, 100);
        if (!header.includes('-- PostgreSQL database dump') && !header.includes('SELECT 1')) {
            throw new Error('Database dump integrity check failed: Invalid SQL header');
        }
        logger.info('Database dump basic validation passed.');
    }

    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    async dumpDatabase(outputPath) {
        return new Promise((resolve, reject) => {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) return reject(new Error('DATABASE_URL not set'));
            
            // For Postgres
            const { execFile } = require('child_process');
            execFile('pg_dump', [dbUrl, '-f', outputPath], { timeout: 300000 }, (error, stdout, stderr) => {
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
            const iv = crypto.randomBytes(16);
            // key may be a 64-char hex string (32 bytes) stored in DB or a raw 32-char string
            let keyBuffer;
            if (key && key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
                keyBuffer = Buffer.from(key, 'hex');
            } else if (key && key.length >= 32) {
                keyBuffer = Buffer.from(key.slice(0, 32), 'utf8');
            } else {
                return reject(new Error('Invalid backup encryption key length'));
            }
            const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);

            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            output.write(iv);
            input.pipe(cipher).pipe(output);

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
                if (row.cloud_file_id && settings.google_drive_enabled === 'true') {
                    try {
                        await googleDriveService.init(settings.google_drive_client_id, settings.google_drive_client_secret, settings.google_drive_refresh_token);
                        await googleDriveService.deleteFile(row.cloud_file_id);
                        logger.info(`Cleanup: Deleted cloud backup ${row.cloud_file_id}`);
                    } catch (cloudErr) {
                        logger.error(`Cleanup: Failed to delete cloud backup ${row.cloud_file_id}:`, cloudErr.message);
                    }
                }
                
                await pool.query('DELETE FROM geosurepath_backups WHERE id = $1', [row.id]);
                logger.info(`Cleanup: Deleted old backup record ${row.filename}`);
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
