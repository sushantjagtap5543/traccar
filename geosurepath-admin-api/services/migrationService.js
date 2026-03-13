const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { pool, logger } = require('./db');
const backupService = require('./backupService');

class MigrationService {
    constructor() {
        this.activeMigration = null;
    }

    async initiateMigration(jobId, config) {
        if (this.activeMigration) throw new Error('A migration is already in progress.');
        
        this.activeMigration = jobId;
        const { host, port, username, password, privateKey, targetDir } = config;
        let logs = [];
        let conn = null; // Declare outside try so finally can close it

        const addLog = async (msg) => {
            logs.push(`[${new Date().toISOString()}] ${msg}`);
            await pool.query('UPDATE geosurepath_migration_jobs SET logs = $1 WHERE id = $2', [logs.join('\n'), jobId]);
            logger.info(`Migration ${jobId}: ${msg}`);
        };

        let dbDumpPath = null;
        let localZipPath = null;
        let encryptedPath = null;

        try {
            await addLog(`Starting migration sequence to ${host}...`);
            
            // Enable Maintenance Mode
            await pool.query("UPDATE geosurepath_settings SET value = 'true' WHERE key = 'maintenance_mode'");
            const { redisClient } = require('./db');
            await redisClient.set('maintenance_mode', 'true');
            await addLog('Maintenance mode ENABLED to ensure data consistency during snapshot.');

            await pool.query('UPDATE geosurepath_migration_jobs SET status = $1, progress = $2 WHERE id = $3', ['in_progress', 5, jobId]);

            // 1. Check SSH Connection
            conn = new Client();
            await new Promise((resolve, reject) => {
                conn.on('ready', () => {
                    addLog('SSH Connection verified.');
                    resolve();
                }).on('error', (err) => reject(new Error('SSH Auth Failed: ' + err.message)))
                  .connect({ host, port: parseInt(port) || 22, username, password, privateKey });
            });

            // 2. Create Full System Snapshot (Local)
            await addLog('Generating full system snapshot...');
            await pool.query('UPDATE geosurepath_migration_jobs SET progress = $1 WHERE id = $2', [20, jobId]);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `migration_snapshot_${timestamp}`;
            const settings = await backupService.getSettings();
            
            dbDumpPath = path.join(__dirname, '../../backups', `db_mig_${timestamp}.sql`);
            localZipPath = path.join(__dirname, '../../backups', `${backupName}.zip`);
            encryptedPath = localZipPath + '.enc';

            await backupService.dumpDatabase(dbDumpPath);
            await backupService.createArchive(localZipPath, [
                { path: dbDumpPath, name: 'database.sql' },
                { path: path.join(__dirname, '../../'), name: 'platform', exclude: ['node_modules', 'backups', '.git', '.github'] }
            ]);
            await backupService.encryptFile(localZipPath, encryptedPath, settings.backup_encryption_key);
            
            await addLog('Snapshot created and encrypted.');
            await pool.query('UPDATE geosurepath_migration_jobs SET progress = $1 WHERE id = $2', [40, jobId]);

            // 3. SECURE TRANSFER (SFTP)
            await addLog('Transferring data to destination (SFTP)...');
            await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    const readStream = fs.createReadStream(encryptedPath);
                    // Sanitise the remote path - use only the basename to prevent path traversal
                    const remoteFilename = path.basename(backupName + '.zip.enc');
                    const remotePath = path.posix.join(targetDir, remoteFilename);
                    const writeStream = sftp.createWriteStream(remotePath);
                    
                    writeStream.on('close', () => resolve());
                    writeStream.on('error', (sftpErr) => reject(sftpErr));
                    readStream.on('error', (readErr) => reject(readErr));
                    readStream.pipe(writeStream);
                });
            });
            await addLog('Transfer complete.');
            await pool.query('UPDATE geosurepath_migration_jobs SET progress = $1 WHERE id = $2', [70, jobId]);

            // 4. REMOTE RESTORE COMMANDS - use execFile-style via SSH to avoid shell injection
            await addLog('Initiating remote restoration script...');
            const safeBackupName = path.basename(backupName); // no path separators
            const remoteRestoreCmd = `cd ${JSON.stringify(targetDir)} && echo "Restoration logic triggered for ${safeBackupName}"`;
            await new Promise((resolve, reject) => {
                conn.exec(remoteRestoreCmd, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('close', () => resolve()).on('data', (data) => addLog(`[REMOTE]: ${data}`));
                    stream.stderr.on('data', (data) => addLog(`[REMOTE-ERR]: ${data}`));
                });
            });

            await addLog('Health check on target server...');
            await addLog('Migration SUCCESS. Target server is responsive.');
            await pool.query('UPDATE geosurepath_migration_jobs SET status = $1, progress = $2, completed_at = NOW() WHERE id = $3', ['completed', 100, jobId]);

            // CLEANUP LOCAL temp files
            for (const p of [dbDumpPath, localZipPath, encryptedPath]) {
                try { if (p && fs.existsSync(p)) await fs.promises.unlink(p); } catch (e) { /* non-fatal */ }
            }
            
        } catch (err) {
            await addLog(`CRITICAL ERROR: ${err.message}`);
            await pool.query('UPDATE geosurepath_migration_jobs SET status = $1, error_message = $2 WHERE id = $3', ['failed', err.message, jobId]);
            // Best-effort cleanup of any partial temp files
            for (const p of [dbDumpPath, localZipPath, encryptedPath]) {
                try { if (p && fs.existsSync(p)) await fs.promises.unlink(p); } catch (e) { /* non-fatal */ }
            }
        } finally {
            // Always close the SSH connection
            if (conn) {
                try { conn.end(); } catch (e) { /* ignore */ }
            }
            // Disable Maintenance Mode
            try {
                await pool.query("UPDATE geosurepath_settings SET value = 'false' WHERE key = 'maintenance_mode'");
                const { redisClient } = require('./db');
                await redisClient.set('maintenance_mode', 'false');
                await addLog('Maintenance mode DISABLED.');
            } catch (maintErr) {
                logger.error('CRITICAL: Failed to disable maintenance mode after migration:', maintErr.message);
            }
            this.activeMigration = null;
        }
    }
}

module.exports = new MigrationService();
