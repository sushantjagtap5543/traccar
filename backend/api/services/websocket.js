const { Server } = require('socket.io');
const { logger } = require('./db');

const initWebSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    io.on('connection', (socket) => {
        logger.info(`WebSocket Client Connected: ${socket.id}`);
        socket.on('disconnect', () => logger.info(`WebSocket Client Disconnected: ${socket.id}`));
    });

    return io;
};

module.exports = { initWebSocket };
