const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger, redisClient } = require('./db');

/**
 * GeoSurePath Real-time Engine (BUG-014)
 * Handles high-concurrency positioning updates and emergency alerts.
 * Implements strict memory management for session cleanup.
 */

let io;
const userConnections = new Map(); // Track connected users for clean teardown

const initWebSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 10000
    });

    // 1. Authentication Middleware (C-013)
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
        const cookie = socket.handshake.headers.cookie;
        
        if (token) {
            try {
                const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
                socket.user = decoded;
                return next();
            } catch (err) {
                // Fallback to cookie if token fails
            }
        }

        if (cookie) {
            try {
                const traccarUrl = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';
                const axios = require('axios');
                const sessionRes = await axios.get(`${traccarUrl}/api/session`, {
                    headers: { Cookie: cookie }
                });
                if (sessionRes.data && sessionRes.data.id) {
                    socket.user = sessionRes.data;
                    socket.user.traccarSession = true;
                    return next();
                }
            } catch (err) {
                logger.error('WebSocket: Cookie auth failed', err.message);
            }
        }

        next(new Error('Authentication failed: No valid token or session'));
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id || socket.user.email || socket.user.userId;
        logger.info(`WebSocket: User ${userId} connected (${socket.id})`);

        // Track connection for cleanup metrics
        if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
        }
        userConnections.get(userId).add(socket.id);

        // Join personal and role-based rooms
        socket.join(`user_${userId}`);
        if (socket.user.role === 'admin') {
            socket.join('admin_broadcast');
            logger.info(`WebSocket: Admin ${userId} joined broadcast channel`);
        }

        socket.on('subscribe_device', async (deviceId) => {
            // Security verification (C-011 / C-013)
            const { pool } = require('./db');
            const ownership = await pool.query("SELECT 1 FROM tc_user_device WHERE userid = $1 AND deviceid = $2", [userId, deviceId]);
            
            if (ownership.rowCount > 0 || socket.user.role === 'admin') {
                socket.join(`device_${deviceId}`);
                logger.debug(`Socket ${socket.id} authorized for device ${deviceId}`);
            } else {
                logger.warn(`Socket ${socket.id} denied access to device ${deviceId}`);
                socket.emit('error', 'Unauthorized device subscription');
            }
        });

        socket.on('disconnect', () => {
            logger.info(`WebSocket: User ${userId} disconnected (${socket.id})`);
            
            // CRITICAL: Memory Leak Cleanup (Fix for BUG-014)
            const connections = userConnections.get(userId);
            if (connections) {
                connections.delete(socket.id);
                if (connections.size === 0) {
                    userConnections.delete(userId);
                }
            }

            // Teardown all room memberships
            socket.rooms.forEach(room => socket.leave(room));
        });

        // Error handling per socket to prevent process crash
        socket.on('error', (err) => {
            logger.error(`Socket Error [${socket.id}]:`, err.message);
        });
    });

    // 2. Start Redis Pub/Sub Listener for Alerts
    startRedisListener();

    return io;
};

const startRedisListener = async () => {
    const subClient = redisClient.duplicate();
    await subClient.connect();

    // Listen for real-time alerts from monitor.js or alertEngine.js
    await subClient.subscribe('geosurepath_realtime_events', (message) => {
        try {
            const event = JSON.parse(message);
            
            // Dispatch to relevant rooms
            if (event.deviceId) {
                io.to(`device_${event.deviceId}`).emit('position_update', event);
            }

            if (event.type === 'ALERT') {
                io.to('admin_broadcast').emit('new_alert', event);
                // Also send to the specific user if applicable
                if (event.userId) {
                    io.to(`user_${event.userId}`).emit('user_alert', event);
                }
            }
        } catch (err) {
            logger.error('WebSocket Redis Listener Error:', err.message);
        }
    });

    logger.info('WebSocket: Redis real-time listener active.');
};

const broadcastAlert = (event) => {
    if (io) {
        io.to('admin_broadcast').emit('urgent_alert', event);
    }
};

module.exports = { initWebSocket, broadcastAlert };
