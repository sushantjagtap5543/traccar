const axios = require('axios');
const { logger, pool, redisClient } = require('./db');
const { sendAlert } = require('./monitor');

/**
 * Enhanced Alert Engine with Session Management
 * Polls Traccar, evaluates rules, and dispatches alerts
 */

let isRunning = false;
let engineInterval = null;
let sessionCookie = null;
let sessionExpiry = null;
const POLL_INTERVAL = 30000; // 30 seconds
const SESSION_REFRESH_MARGIN = 60 * 60 * 1000; // Refresh 1 hour before expiry

const getClient = () => {
    const traccarUrl = process.env.TRACCAR_URL || 'http://traccar:8082';
    const config = {
        baseURL: traccarUrl,
        timeout: 10000,
        headers: {}
    };

    if (sessionCookie && sessionExpiry && Date.now() < sessionExpiry) {
        config.headers['Cookie'] = sessionCookie;
    } else {
        config.auth = {
            username: process.env.TRACCAR_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
            password: process.env.TRACCAR_ADMIN_PASSWORD
        };
    }

    return axios.create(config);
};

let isRefreshing = false;

const refreshSession = async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    try {
        const client = axios.create({
            baseURL: process.env.TRACCAR_URL || 'http://traccar:8082',
            timeout: 10000,
            auth: {
                username: process.env.TRACCAR_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
                password: process.env.TRACCAR_ADMIN_PASSWORD
            }
        });

        const authRes = await client.get('/api/session');
        if (authRes.headers['set-cookie']) {
            sessionCookie = authRes.headers['set-cookie'][0].split(';')[0];
            sessionExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
            logger.info('Alert Engine: Traccar session established');
            return true;
        }
        return false;
    } catch (err) {
        logger.error('Alert Engine: Session refresh failed', { error: err.message });
        sessionCookie = null;
        sessionExpiry = null;
        return false;
    } finally {
        isRefreshing = false;
    }
};

const processAlerts = async () => {
    if (!isRunning) return;

    try {
        if (!sessionCookie || !sessionExpiry || (sessionExpiry - Date.now() < SESSION_REFRESH_MARGIN)) {
            await refreshSession();
        }

        const client = getClient();

        // 1. Fetch Config
        let config;
        try {
            const dbRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'alert_rules_config' LIMIT 1");
            if (dbRes.rowCount > 0) {
                config = JSON.parse(dbRes.rows[0].value);
            } else {
                const serverRes = await client.get('/api/server');
                if (serverRes.data.attributes?.alertConfig) {
                    config = JSON.parse(serverRes.data.attributes.alertConfig);
                }
            }
        } catch (configErr) {
            logger.error('Alert Engine: Failed to fetch rules config', configErr.message);
            return;
        }

        if (!config) return;

        // 2. Fetch Devices & Positions (Batch)
        let devicesData, positionsData;
        try {
            const [devicesRes, positionsRes] = await Promise.all([
                client.get('/api/devices'),
                client.get('/api/positions')
            ]);
            devicesData = devicesRes.data;
            positionsData = positionsRes.data;
        } catch (fetchErr) {
            logger.error('Alert Engine: Data fetch error', fetchErr.message);
            return;
        }

        const positionMap = new Map(positionsData.map(p => [p.deviceId, p]));

        for (const device of devicesData) {
            try {
                const pos = positionMap.get(device.id);
                if (!pos) continue;

                const alarm = pos.attributes?.alarm;

                // Rule evaluation
                if (config.overSpeed?.enabled) {
                    const speedKph = pos.speed * 1.852;
                    if (speedKph > config.overSpeed.threshold) {
                        await sendAlert('VEHICLE_OVERSPEED', `Vehicle ${device.name} is traveling at ${speedKph.toFixed(1)} km/h.`, 'WARNING', device.id);
                    }
                }

                if (config.batteryLow?.enabled && pos.attributes?.batteryLevel !== undefined) {
                    if (pos.attributes.batteryLevel < config.batteryLow.threshold) {
                        await sendAlert('LOW_BATTERY', `Vehicle ${device.name} battery is at ${pos.attributes.batteryLevel}%.`, 'WARNING', device.id);
                    }
                }

                if (config.powerCut?.enabled && alarm === 'powerCut') {
                    await sendAlert('POWER_CUT', `External power disconnected for vehicle ${device.name}!`, 'CRITICAL', device.id);
                }

                if (config.deviceDisconnected?.enabled && device.status === 'offline') {
                    const lastUpdate = new Date(device.lastUpdate).getTime();
                    const threshold = (config.deviceDisconnected.thresholdMinutes || 10) * 60000;
                    if (Date.now() - lastUpdate > threshold) {
                        await sendAlert('DEVICE_OFFLINE', `Telemetry lost for vehicle ${device.name}.`, 'WARNING', device.id);
                    }
                }

                if (alarm === 'sos') {
                    await sendAlert('SOS_ALERT', `EMERGENCY: ${device.name} panic button activated!`, 'CRITICAL', device.id);
                }

                if (pos.attributes?.ignition !== undefined) {
                    const prevState = await redisClient.get(`ignition:${device.id}`);
                    const currentState = String(pos.attributes.ignition);
                    if (prevState && prevState !== currentState) {
                        const status = pos.attributes.ignition ? 'ON' : 'OFF';
                        await sendAlert('IGNITION_STATUS', `Ignition turned ${status} for vehicle ${device.name}.`, 'INFO', device.id);
                    }
                    await redisClient.set(`ignition:${device.id}`, currentState, { EX: 86400 });
                }

                if (pos.speed < 0.1 && pos.attributes?.ignition) {
                    const idleStart = await redisClient.get(`idle_start:${device.id}`);
                    if (!idleStart) {
                        await redisClient.set(`idle_start:${device.id}`, Date.now().toString(), { EX: 3600 });
                    } else {
                        const idleTime = (Date.now() - parseInt(idleStart)) / 60000;
                        if (idleTime > (config.idleThresholdMinutes || 15)) {
                            await sendAlert('VEHICLE_IDLE', `Vehicle ${device.name} has been idling for ${Math.floor(idleTime)} minutes.`, 'WARNING', device.id);
                            // Reset to avoid spamming every cycle if needed, or use a flag
                            await redisClient.set(`idle_start:${device.id}`, Date.now().toString(), { EX: 3600 });
                        }
                    }
                } else {
                    await redisClient.del(`idle_start:${device.id}`);
                }
                
                // Geofence events
                if (alarm === 'geofenceExit') {
                    await sendAlert('GEOFENCE_EXIT', `Vehicle ${device.name} exited geofence.`, 'WARNING', device.id);
                }
                if (alarm === 'geofenceEnter') {
                    await sendAlert('GEOFENCE_ENTER', `Vehicle ${device.name} entered geofence.`, 'INFO', device.id);
                }
            } catch (deviceErr) {
                logger.error(`Alert Engine: Failed to process device ${device.id}`, deviceErr.message);
            }
        }

    } catch (err) {
        logger.error('Alert Engine Cycle Error:', err.message);
        if (err.response?.status === 401) {
            sessionCookie = null;
            sessionExpiry = null;
        }
    }
};

const startAlertEngine = () => {
    if (isRunning) return;
    isRunning = true;
    logger.info('Alert Engine (Optimized) started.');
    engineInterval = setInterval(processAlerts, POLL_INTERVAL);
    processAlerts(); // Run immediately
};

const stopAlertEngine = () => {
    isRunning = false;
    if (engineInterval) clearInterval(engineInterval);
    logger.info('Alert Engine stopped.');
};

module.exports = { startAlertEngine, stopAlertEngine };
