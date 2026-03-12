const { google } = require('googleapis');
const fs = require('fs');
const { logger } = require('./db');

class GoogleDriveService {
    constructor() {
        this.oauth2Client = null;
    }

    async init(clientId, clientSecret, refreshToken) {
        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Google Drive credentials missing');
        }
        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'postmessage');
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    async uploadFile(filePath, fileName) {
        if (!this.oauth2Client) throw new Error('Google Drive Service not initialized');
        
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const fileMetadata = {
            name: fileName,
            parents: [] // Can be configured to a specific folder
        };
        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(filePath)
        };

        try {
            const response = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            });
            logger.info(`File uploaded to Google Drive: ${fileName} (ID: ${response.data.id})`);
            return response.data.id;
        } catch (err) {
            logger.error('Google Drive Upload Error:', err);
            throw err;
        }
    }

    async listFiles() {
        if (!this.oauth2Client) throw new Error('Google Drive Service not initialized');
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const res = await drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, createdTime, size)',
            orderBy: 'createdTime desc'
        });
        return res.data.files;
    }

    async deleteFile(fileId) {
        if (!this.oauth2Client) throw new Error('Google Drive Service not initialized');
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        await drive.files.delete({ fileId });
    }
}

module.exports = new GoogleDriveService();
