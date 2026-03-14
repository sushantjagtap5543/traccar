const axios = require('axios');
const { pool, redisClient, logger } = require('./db');
const { sendAlert } = require('./monitor');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';
const POLL_INTERVAL = 30000; // 30 seconds

let engineInterval = null;

const startAlertEngine = () => {
    if (engineInterval) return;
    logger.info('Starting Telemetry & Alert Engine...');
    engineInterval = setInterval(processAlerts, POLL_INTERVAL);
};

const stopAlertEngine = () => {
    if (engineInterval) {
        clearInterval(engineInterval);
        engineInterval = null;
        logger.info('Alert Engine stopped.');
    }
};

const processAlerts = async () => {
    try {
        // 1. Fetch all active devices and their last positions from Traccar
        const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
            auth: {
                username: process.env.TRACCAR_ADMIN_EMAIL || 'admin',
                password: process.env.TRACCAR_ADMIN_PASSWORD || 'admin'
            }
        });

        const devices = response.data;
        for (const device of devices) {
            await evaluateDeviceAlerts(device);
        }
    } catch (err) {
        logger.error('Alert Engine Error:', err.message);
    }
};

const evaluateDeviceAlerts = async (device) => {
    const { id, lastUpdate, positionId, attributes, status } = device;
    if (!positionId) return;

    try {
        // Fetch position details
        const posRes = await axios.get(`${TRACCAR_URL}/api/positions?id=${positionId}`, {
            auth: { username: 'admin', password: 'admin' }
        });
        const position = posRes.data[0];
        if (!position) return;

        // --- ALERT LOGIC ---

        // 1. Overspeeding
        const speedLimit = attributes.speedLimit || 80;
        if (position.speed > speedLimit) {
            await sendAlert('OVERSPEED', `Vehicle exceeded speed limit of ${speedLimit} km/h. Current: ${position.speed.toFixed(1)} km/h`, 'WARNING', id);
        }

        // 2. SOS
        if (position.attributes.alarm === 'sos') {
            await sendAlert('SOS', 'Emergency Panic Button Activated!', 'EMERGENCY', id);
        }

        // 3. Power Cut
        if (position.attributes.alarm === 'powerCut') {
            await sendAlert('POWER_CUT', 'External power supply disconnected.', 'CRITICAL', id);
        }

        // 4. Vibration
        if (position.attributes.alarm === 'vibration') {
            await sendAlert('VIBRATION', 'Vehicle vibration/tampering detected.', 'WARNING', id);
        }

        // 5. Low Battery
        if (position.attributes.batteryLevel < 20) {
            await sendAlert('LOW_BATTERY', `Internal battery critically low: ${position.attributes.batteryLevel}%`, 'WARNING', id);
        }

        // 6. Geofence Events (Traccar handles these, we just proxy if needed)
        // ...

        // 7. Route Violation (NEW)
        if (position.attributes.routeViolation) {
            await sendAlert('ROUTE_VIOLATION', 'Vehicle deviated from assigned route corridor.', 'CRITICAL', id);
        }

        // 8. Route Delay (NEW)
        if (position.attributes.routeDelay) {
            await sendAlert('ROUTE_DELAY', 'Vehicle is running behind scheduled route timeline.', 'WARNING', id);
        }

        // 9. Tow Alert
        if (position.attributes.alarm === 'tow' || (status === 'stationary' && position.speed > 5)) {
            await sendAlert('TOW_ALERT', 'Unauthorized movement detected while ignition is OFF.', 'CRITICAL', id);
        }

        // 10. Excess Idle
        if (position.attributes.motion === false && position.attributes.ignition === true) {
            const idleKey = `idle_time:${id}`;
            const idleStart = await redisClient.get(idleKey);
            if (!idleStart) {
                await redisClient.set(idleKey, Date.now());
            } else {
                const duration = (Date.now() - parseInt(idleStart)) / 60000;
                if (duration > 15) { // 15 mins
                    await sendAlert('EXCESS_IDLE', `Vehicle idling for ${duration.toFixed(0)} minutes.`, 'WARNING', id);
                }
            }
        } else {
            await redisClient.del(`idle_time:${id}`);
        }

        // 11. AC Status
        if (position.attributes.ac !== undefined) {
            const acKey = `ac_status:${id}`;
            const lastAC = await redisClient.get(acKey);
            if (lastAC !== null && lastAC !== position.attributes.ac.toString()) {
                await sendAlert('AC_EVENT', `AC turned ${position.attributes.ac ? 'ON' : 'OFF'}`, 'INFO', id);
            }
            await redisClient.set(acKey, position.attributes.ac.toString());
        }

        // 12. Ignition Event
        const ignKey = `ign_status:${id}`;
        const lastIgn = await redisClient.get(ignKey);
        if (lastIgn !== null && lastIgn !== position.attributes.ignition.toString()) {
            await sendAlert('IGNITION_EVENT', `Ignition turned ${position.attributes.ignition ? 'ON' : 'OFF'}`, 'INFO', id);
        }
        await redisClient.set(ignKey, position.attributes.ignition.toString());

        // 13. Harsh Braking
        if (position.attributes.harshBraking) {
            await sendAlert('HARSH_BRAKING', 'Aggressive braking detected.', 'WARNING', id);
        }

        // 14. Harsh Acceleration
        if (position.attributes.harshAcceleration) {
            await sendAlert('HARSH_ACCEL', 'Aggressive acceleration detected.', 'WARNING', id);
        }

        // 15. Harsh Cornering
        if (position.attributes.harshCornering) {
            await sendAlert('HARSH_CORNER', 'Aggressive cornering detected.', 'WARNING', id);
        }

        // 16. Door Alert
        if (position.attributes.doorStatus === 'open' || position.attributes.alarm === 'door') {
            await sendAlert('DOOR_ALERT', 'Vehicle door opened unexpectedly.', 'WARNING', id);
        }

        // 17. Fuel Theft/Refill
        if (position.attributes.fuelDrop > 5) {
            await sendAlert('FUEL_THEFT', `Significant fuel drop detected: ${position.attributes.fuelDrop}L`, 'CRITICAL', id);
        } else if (position.attributes.fuelIncrease > 5) {
            await sendAlert('FUEL_REFILL', `Fuel refill detected: ${position.attributes.fuelIncrease}L`, 'INFO', id);
        }

        // 18. Tamper Alert
        if (position.attributes.alarm === 'tamper' || position.attributes.blocked) {
            await sendAlert('TAMPER_ALERT', 'Device tampering or case open detected.', 'CRITICAL', id);
        }

    } catch (err) {
        logger.error(`Failed to evaluate alerts for device ${id}: ${err.message}`);
    }
};

module.exports = { startAlertEngine, stopAlertEngine };
