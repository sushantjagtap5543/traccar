const net = require('net');
const ports = [5432, 6379, 8082];
ports.forEach(port => {
    const client = new net.Socket();
    client.connect(port, '127.0.0.1', () => {
        console.log(`Port ${port} is OPEN`);
        client.destroy();
    });
    client.on('error', () => {
        console.log(`Port ${port} is CLOSED`);
    });
});
