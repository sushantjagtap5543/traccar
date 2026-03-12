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
                    const speedKph = pos.speed * 1.852;
                    if (speedKph > config.overSpeed.threshold) {
                        await sendAlert('VEHICLE_OVERSPEED', `Vehicle ${device.name} is traveling at ${speedKph.toFixed(1)} km/h.`, 'WARNING', device.id);
                    }
                }

                // Check Battery
                if (config.batteryLow?.enabled && pos.attributes?.batteryLevel !== undefined) {
                    if (pos.attributes.batteryLevel < config.batteryLow.threshold) {
                        await sendAlert('LOW_BATTERY', `Vehicle ${device.name} battery is at ${pos.attributes.batteryLevel}%.`, 'WARNING', device.id);
                    }
                }

                // Check Engine Status
                if (config.engineOn?.enabled && pos.attributes?.ignition) {
                    await sendAlert('ENGINE_ON', `Vehicle ${device.name} engine started.`, 'INFO', device.id);
                }
                if (config.engineOff?.enabled && pos.attributes?.ignition === false) {
                    await sendAlert('ENGINE_OFF', `Vehicle ${device.name} engine stopped.`, 'INFO', device.id);
                }

                // Check Security / Tampering
                if (config.powerCut?.enabled && pos.attributes?.alarm === 'powerCut') {
                    await sendAlert('POWER_CUT', `External power disconnected for vehicle ${device.name}!`, 'CRITICAL', device.id);
                }
                if (config.ignitionTampering?.enabled && pos.attributes?.alarm === 'vibration') {
                    await sendAlert('VIBRATION_ALARM', `Structural vibration detected on vehicle ${device.name}.`, 'WARNING', device.id);
                }
                if (config.towAlert?.enabled && pos.attributes?.alarm === 'tow') {
                    await sendAlert('TOW_ALERT', `Vehicle ${device.name} is being moved without ignition!`, 'CRITICAL', device.id);
                }

                // Check Operational / Behavior
                if (config.harshBraking?.enabled && pos.attributes?.alarm === 'hardBraking') {
                    await sendAlert('HARSH_BRAKING', `Aggressive braking detected on ${device.name}.`, 'WARNING', device.id);
                }
                if (config.harshAcceleration?.enabled && pos.attributes?.alarm === 'hardAcceleration') {
                    await sendAlert('HARSH_ACCEL', `Aggressive acceleration detected on ${device.name}.`, 'WARNING', device.id);
                }
                if (config.sharpTurning?.enabled && pos.attributes?.alarm === 'hardCornering') {
                    await sendAlert('SHARP_TURNING', `Dangerous cornering detected on ${device.name}.`, 'WARNING', device.id);
                }

                // Device Connectivity
                if (config.deviceDisconnected?.enabled && device.status === 'offline') {
                    await sendAlert('DEVICE_OFFLINE', `Telemetry lost for vehicle ${device.name}.`, 'WARNING', device.id);
                }
                if (config.gpsLost?.enabled && pos.valid === false) {
                    await sendAlert('GPS_SIGNAL_LOST', `GPS fix lost for vehicle ${device.name}.`, 'WARNING', device.id);
                }
            }

        } catch (err) {
            logger.error('Alert Engine Error:', err.message);
        }
    }, POLL_INTERVAL);
};

module.exports = { startAlertEngine };
