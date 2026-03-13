/**
 * GeoSurePath Load Test Simulator (TM-002)
 * Goal: Simulate 1,000 devices sending telemetry to verify DB performance.
 */
const axios = require('axios');

const TRACCAR_IP = process.env.TRACCAR_IP || '127.0.0.1';
const PROTOCOL_PORT = 5055; // OsmAnd protocol (standard for testing)
const DEVICE_COUNT = 1000;
const INTERVAL_MS = 10000; // Each device sends every 10 seconds

console.log(`🚀 Starting load test simulator: ${DEVICE_COUNT} devices...`);

const simulateDevice = async (id) => {
    const lat = 18.5204 + (Math.random() - 0.5) * 0.1;
    const lon = 73.8567 + (Math.random() - 0.5) * 0.1;
    const speed = Math.floor(Math.random() * 100);
    const idString = `TEST_DEV_${id.toString().padStart(4, '0')}`;

    try {
        const url = `http://${TRACCAR_IP}:${PROTOCOL_PORT}/?id=${idString}&lat=${lat}&lon=${lon}&speed=${speed}`;
        await axios.get(url);
    } catch (err) {
        // Silently fail if server is busy, we expect some noise under load
    }
};

const runTick = () => {
    for (let i = 1; i <= DEVICE_COUNT; i++) {
        // Stagger the calls within the tick to avoid a huge burst at millisecond zero
        setTimeout(() => simulateDevice(i), Math.random() * 5000);
    }
};

// Start the loop
setInterval(runTick, INTERVAL_MS);
runTick();

console.log(`📡 Simulation running. Check 'tc_positions' table for ingest rate.`);
