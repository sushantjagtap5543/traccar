const axios = require('axios');
const { logger } = require('./db');
const { sendAlert } = require('./monitor');

/**
 * GeoSurePath Alert Engine
 * Polls Traccar API, compares live telemetry against Admin-defined rules,
 * and dispatches alerts via the monitor/webhook system.
 */

let isRunning = false;
let sessionCookie = null;
let engineInterval = null;
const POLL_INTERVAL = 30000; // 30 seconds

const getClient = () => {
    const traccarUrl = process.env.TRACCAR_URL || 'http://traccar:8082';
    const config = {
        baseURL: traccarUrl,
        headers: {}
    };

    if (sessionCookie) {
        config.headers['Cookie'] = sessionCookie;
    } else {
        config.auth = {
            username: process.env.ADMIN_EMAIL || 'admin@geosurepath.com',
            password: process.env.TRACCAR_ADMIN_PASSWORD || 'admin'
        };
    }

    return axios.create(config);
};

const startAlertEngine = () => {
    if (isRunning) return;
    isRunning = true;
    logger.info('GeoSurePath Alert Engine started with Session Cache.');

    engineInterval = setInterval(async () => {
        try {
            let client = getClient();

            // 1. Ensure session
            if (!sessionCookie) {
                try {
                    const authRes = await client.get('/api/session');
                    if (authRes.headers['set-cookie']) {
                        sessionCookie = authRes.headers['set-cookie'][0].split(';')[0];
                        logger.info('Alert Engine: Traccar Session Established.');
                        client = getClient(); // Refresh client with cookie
                    }
                } catch (err) {
                    logger.error('Alert Engine Auth Failed:', err.message);
                    return;
                }
            }

            // 2. Fetch Config from Traccar Server Attributes
            let server;
            try {
                const serverRes = await client.get('/api/server');
                server = serverRes.data;
            } catch (err) {
                if (err.response?.status === 401) sessionCookie = null; // Reset session on 401
                throw err;
            }

            if (!server.attributes?.alertConfig) return;
            
            let config;
            try {
                config = JSON.parse(server.attributes.alertConfig);
            } catch (err) {
                logger.error('Alert Engine: Invalid alertConfig JSON in server attributes:', { error: err.message });
                return;
            }

            // 3. Fetch Devices
            const devicesRes = await client.get('/api/devices');

            for (const device of devicesRes.data) {
                if (!device.lastUpdate) continue;

                // 4. Get Latest Position
                const posRes = await client.get(`/api/positions?deviceId=${device.id}`);
                if (posRes.data.length === 0) continue;
                const pos = posRes.data[0];
                const alarm = pos.attributes?.alarm;

                // Overspeed
                if (config.overSpeed?.enabled) {
                    const speedKph = pos.speed * 1.852;
                    if (speedKph > config.overSpeed.threshold) {
                        await sendAlert('VEHICLE_OVERSPEED', `Vehicle ${device.name} is traveling at ${speedKph.toFixed(1)} km/h.`, 'WARNING', device.id);
                    }
                }

                // Battery
                if (config.batteryLow?.enabled && pos.attributes?.batteryLevel !== undefined) {
                    if (pos.attributes.batteryLevel < config.batteryLow.threshold) {
                        await sendAlert('LOW_BATTERY', `Vehicle ${device.name} battery is at ${pos.attributes.batteryLevel}%.`, 'WARNING', device.id);
                    }
                }

                // Engine
                if (config.engineOn?.enabled && pos.attributes?.ignition) {
                    await sendAlert('ENGINE_ON', `Vehicle ${device.name} engine started.`, 'INFO', device.id);
                }
                if (config.engineOff?.enabled && pos.attributes?.ignition === false) {
                    await sendAlert('ENGINE_OFF', `Vehicle ${device.name} engine stopped.`, 'INFO', device.id);
                }

                // Security Alarms
                if (config.powerCut?.enabled && alarm === 'powerCut') {
                    await sendAlert('POWER_CUT', `External power disconnected for vehicle ${device.name}!`, 'CRITICAL', device.id);
                }
                if (config.ignitionTampering?.enabled && alarm === 'vibration') {
                    await sendAlert('VIBRATION_ALARM', `Structural vibration detected on vehicle ${device.name}.`, 'WARNING', device.id);
                }
                if (config.towAlert?.enabled && alarm === 'tow') {
                    await sendAlert('TOW_ALERT', `Vehicle ${device.name} is being moved without ignition!`, 'CRITICAL', device.id);
                }

                // Connectivity
                if (config.deviceDisconnected?.enabled && device.status === 'offline') {
                    await sendAlert('DEVICE_OFFLINE', `Telemetry lost for vehicle ${device.name}.`, 'WARNING', device.id);
                }
                if (config.gpsLost?.enabled && pos.valid === false) {
                    await sendAlert('GPS_SIGNAL_LOST', `GPS fix lost for vehicle ${device.name}.`, 'WARNING', device.id);
                }

                // Idle & Stop
                if (config.excessIdle?.enabled && pos.attributes?.motion === false) {
                    const idleRes = await client.get(`/api/reports/summary?deviceId=${device.id}&from=${new Date(Date.now() - config.excessIdle.threshold * 60000).toISOString()}&to=${new Date().toISOString()}`);
                    if (idleRes.data.length > 0 && idleRes.data[0].engineHours > 0 && idleRes.data[0].distance === 0) {
                        await sendAlert('EXCESS_IDLE', `Vehicle ${device.name} has been idling for over ${config.excessIdle.threshold} minutes.`, 'WARNING', device.id);
                    }
                }
                if (config.unexpectedStop?.enabled && alarm === 'stop') {
                    await sendAlert('UNEXPECTED_STOP', `Unexpected stop detected for vehicle ${device.name}.`, 'WARNING', device.id);
                }

                // Geofence / Route Logistics (FIXED COLLISION)
                if (alarm === 'geofenceExit') {
                    const geoType = pos.attributes?.geofenceType || 'unknown';
                    if (config.routeStart?.enabled && geoType === 'depot') {
                        await sendAlert('ROUTE_STARTED', `Vehicle ${device.name} has departed from the depot.`, 'INFO', device.id);
                    } else if (config.routeViolation?.enabled) {
                        // If not a depot exit, it's a route violation (corridor/zone exit)
                        await sendAlert('ROUTE_VIOLATION', `Vehicle ${device.name} deviated from assigned route/geofence.`, 'CRITICAL', device.id);
                    }
                }

                if (config.routeCompleted?.enabled && alarm === 'geofenceEnter') {
                    const geoType = pos.attributes?.geofenceType || 'unknown';
                    if (geoType === 'destination' || geoType === 'depot') {
                        await sendAlert('ROUTE_COMPLETED', `Vehicle ${device.name} reached destination.`, 'INFO', device.id);
                    }
                }

                if (config.routeDelay?.enabled && device.status === 'online' && pos.speed < 5) {
                    await sendAlert('ROUTE_DELAY', `Vehicle ${device.name} is experiencing delays in transit.`, 'WARNING', device.id);
                }
            }

        } catch (err) {
            logger.error('Alert Engine Error:', err.message);
            if (err.response?.status === 401) sessionCookie = null;
        }
    }, POLL_INTERVAL);
};

const stopAlertEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
    }
    isRunning = false;
    logger.info('GeoSurePath Alert Engine stopped.');
};

module.exports = { startAlertEngine, stopAlertEngine };
