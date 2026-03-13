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
            origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()),
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 10000
    });

    // 1. Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
        
        if (!token) return next(new Error('Authentication failed: Missing token'));

        try {
            const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication failed: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id || socket.user.email;
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

        socket.on('subscribe_device', (deviceId) => {
            // In a real multi-tenant scenario, verify device ownership here
            socket.join(`device_${deviceId}`);
            logger.debug(`Socket ${socket.id} subscribed to device ${deviceId}`);
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
