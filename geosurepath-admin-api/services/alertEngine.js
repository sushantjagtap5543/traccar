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
    const traccarUrl = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';
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
            baseURL: process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082',
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

        // 1. Fetch Config (Cached - Fix for BUG-019)
        let config;
        try {
            const cacheKey = 'alert_rules_config_v2';
            const cachedArr = await redisClient.get(cacheKey);
            if (cachedArr) {
                config = JSON.parse(cachedArr);
            } else {
                const dbRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'alert_rules_config' LIMIT 1");
                if (dbRes.rowCount > 0) {
                    config = JSON.parse(dbRes.rows[0].value);
                    await redisClient.set(cacheKey, JSON.stringify(config), { EX: 300 }); // 5 min cache
                } else {
                    const serverRes = await client.get('/api/server');
                    if (serverRes.data.attributes?.alertConfig) {
                        config = JSON.parse(serverRes.data.attributes.alertConfig);
                        await redisClient.set(cacheKey, JSON.stringify(config), { EX: 300 });
                    }
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

        // 3. Fetch Device -> Owner Mapping & Per-User Config (Fix for C-009)
        const ownerRes = await pool.query("SELECT deviceid, userid FROM tc_user_device");
        const deviceOwnerMap = new Map(ownerRes.rows.map(r => [r.deviceid, r.userid]));
        
        // Batch fetch all user configs to avoid N+1 queries
        const userIds = [...new Set(ownerRes.rows.map(r => r.userid))];
        const configRes = await pool.query(
            "SELECT user_id, value FROM geosurepath_settings WHERE key = 'alert_config' AND user_id = ANY($1::int[])",
            [userIds]
        );
        const userConfigMap = new Map(configRes.rows.map(r => [r.user_id, JSON.parse(r.value)]));

        // Evaluation Loop (Parallel - Fix for WF-012)
        const evaluationTasks = devicesData.map(async (device) => {
            try {
                const pos = positionMap.get(device.id);
                if (!pos) return;

                const ownerId = deviceOwnerMap.get(device.id);
                const userConfig = userConfigMap.get(ownerId) || config; // Fallback to global config

                const alarm = pos.attributes?.alarm;

                // Rule evaluation using per-user config
                if (userConfig.overSpeed?.enabled) {
                    const speedKph = pos.speed * 1.852;
                    if (speedKph > userConfig.overSpeed.threshold) {
                        await sendAlert('VEHICLE_OVERSPEED', `Vehicle ${device.name} is traveling at ${speedKph.toFixed(1)} km/h.`, 'WARNING', device.id);
                    }
                }

                if (userConfig.batteryLow?.enabled && pos.attributes?.batteryLevel !== undefined) {
                    if (pos.attributes.batteryLevel < userConfig.batteryLow.threshold) {
                        await sendAlert('LOW_BATTERY', `Vehicle ${device.name} battery is at ${pos.attributes.batteryLevel}%.`, 'WARNING', device.id);
                    }
                }

                if (userConfig.powerCut?.enabled && alarm === 'powerCut') {
                    await sendAlert('POWER_CUT', `External power disconnected for vehicle ${device.name}!`, 'CRITICAL', device.id);
                }
 
                if (userConfig.deviceDisconnected?.enabled && device.status === 'offline') {
                    const lastUpdate = new Date(device.lastUpdate).getTime();
                    const threshold = (userConfig.deviceDisconnected.thresholdMinutes || 10) * 60000;
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
                            // Set high cooldown flag
                            await redisClient.set(`idle_start:${device.id}`, Date.now().toString(), { EX: 3600 });
                        }
                    }
                } else {
                    await redisClient.del(`idle_start:${device.id}`);
                }
                
                // Geofence events with state tracking (Fix for WF-010)
                const geofenceKey = `geofence_state:${device.id}`;
                const currentGeoAlarm = alarm?.startsWith('geofence') ? alarm : 'none';
                const prevGeoAlarm = await redisClient.get(geofenceKey) || 'none';

                if (currentGeoAlarm !== prevGeoAlarm && currentGeoAlarm !== 'none') {
                    if (currentGeoAlarm === 'geofenceExit') {
                        await sendAlert('GEOFENCE_EXIT', `Vehicle ${device.name} exited geofence.`, 'WARNING', device.id);
                    } else if (currentGeoAlarm === 'geofenceEnter') {
                        await sendAlert('GEOFENCE_ENTER', `Vehicle ${device.name} entered geofence.`, 'INFO', device.id);
                    }
                }
                
                if (currentGeoAlarm !== prevGeoAlarm) {
                    await redisClient.set(geofenceKey, currentGeoAlarm, { EX: 86400 });
                }

                // 10. GPS Signal Lost
                if (pos.valid === false) {
                    await sendAlert('GPS_SIGNAL_LOST', `Vehicle ${device.name} lost GPS fix.`, 'WARNING', device.id);
                }

                // 12. Harsh Braking/Acceleration
                if (alarm === 'harshBraking' || alarm === 'harshAcceleration') {
                    const type = alarm === 'harshBraking' ? 'Harsh Braking' : 'Harsh Acceleration';
                    await sendAlert('DRIVING_BEHAVIOR', `${type} detected for vehicle ${device.name}.`, 'WARNING', device.id);
                }

                // 13. Fuel Drop
                if (alarm === 'fuelDrop') {
                    await sendAlert('FUEL_THEFT', `Rapid fuel level reduction detected for vehicle ${device.name}!`, 'CRITICAL', device.id);
                }

                // 14. Temperature
                if (pos.attributes?.temp1 !== undefined) {
                    const temp = parseFloat(pos.attributes.temp1);
                    if (userConfig.temperature?.enabled && (temp > userConfig.temperature.max || temp < userConfig.temperature.min)) {
                        await sendAlert('TEMPERATURE_VIOLATION', `Vehicle ${device.name} temperature is ${temp}°C (Range: ${userConfig.temperature.min}-${userConfig.temperature.max}°C).`, 'WARNING', device.id);
                    }
                }

                // 16. Door Open
                if (alarm === 'door' || pos.attributes?.door === true) {
                    await sendAlert('DOOR_OPEN', `Unauthorized door access for vehicle ${device.name}.`, 'WARNING', device.id);
                }

                // 17. Maintenance Due
                if (pos.attributes?.totalDistance !== undefined) {
                    const distance = pos.attributes.totalDistance / 1000; // km
                    if (userConfig.maintenance?.enabled && distance >= userConfig.maintenance.threshold) {
                        await sendAlert('MAINTENANCE_DUE', `Vehicle ${device.name} has reached ${distance.toFixed(0)} km. Service required.`, 'INFO', device.id);
                    }
                }

                // 3. Vibration & 4. Tow Alert
                if (alarm === 'vibration') {
                    await sendAlert('VIBRATION_ALERT', `Vibration/Tamper detected for vehicle ${device.name}.`, 'WARNING', device.id);
                }
                
                if (pos.speed > 0.01 && !pos.attributes?.ignition) {
                    await sendAlert('TOW_ALERT', `Unauthorized movement detected for vehicle ${device.name} (Ignition OFF).`, 'CRITICAL', device.id);
                }
            } catch (deviceErr) {
                logger.error(`Alert Engine: Failed to process device ${device.id}`, deviceErr.message);
            }
        });

        await Promise.all(evaluationTasks);

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
