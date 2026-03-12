const axios = require('axios');
const { logger } = require('./db');
const { sendAlert } = require('./monitor');

/**
 * GeoSurePath Alert Engine
 * Polls Traccar API, compares live telemetry against Admin-defined rules,
 * and dispatches alerts via the monitor/webhook system.
 */

let isRunning = false;
const POLL_INTERVAL = 30000; // 30 seconds

const startAlertEngine = () => {
    if (isRunning) return;
    isRunning = true;
    logger.info('GeoSurePath Alert Engine started.');

    setInterval(async () => {
        try {
            const traccarUrl = process.env.TRACCAR_URL || 'http://traccar:8082';
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@geosurepath.com';
            // Note: In a real system, we'd use a service account or master token
            // For now, we'll try to get the server config first

            const serverRes = await axios.get(`${traccarUrl}/api/server`, {
                auth: { username: adminEmail, password: process.env.TRACCAR_ADMIN_PASSWORD || 'admin' }
            });

            const server = serverRes.data;
            if (!server.attributes?.alertConfig) return;

            const config = JSON.parse(server.attributes.alertConfig);

            // Fetch devices and positions
            const devicesRes = await axios.get(`${traccarUrl}/api/devices`, {
                auth: { username: adminEmail, password: process.env.TRACCAR_ADMIN_PASSWORD || 'admin' }
            });

            for (const device of devicesRes.data) {
                if (!device.lastUpdate) continue;

                // Get latest position
                const posRes = await axios.get(`${traccarUrl}/api/positions?deviceId=${device.id}`, {
                    auth: { username: adminEmail, password: process.env.TRACCAR_ADMIN_PASSWORD || 'admin' }
                });

                if (posRes.data.length === 0) continue;
                const pos = posRes.data[0];

                // Check Overspeed
                if (config.overSpeed?.enabled) {
                    const speedKph = pos.speed * 1.852; // knots to kph
                    if (speedKph > config.overSpeed.threshold) {
                        await sendAlert(
                            'VEHICLE_OVERSPEED',
                            `Vehicle ${device.name} (ID: ${device.id}) is traveling at ${speedKph.toFixed(1)} km/h, exceeding limit of ${config.overSpeed.threshold} km/h.`,
                            'WARNING'
                        );
                    }
                }

                // Check Battery
                if (config.batteryLow?.enabled && pos.attributes?.batteryLevel !== undefined) {
                    if (pos.attributes.batteryLevel < config.batteryLow.threshold) {
                        await sendAlert(
                            'LOW_BATTERY',
                            `Vehicle ${device.name} battery is at ${pos.attributes.batteryLevel}%, below threshold of ${config.batteryLow.threshold}%.`,
                            'WARNING'
                        );
                    }
                }
            }

        } catch (err) {
            logger.error('Alert Engine Error:', err.message);
        }
    }, POLL_INTERVAL);
};

module.exports = { startAlertEngine };
