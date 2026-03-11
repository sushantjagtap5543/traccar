require('dotenv').config();
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8083;

// Security: Require Admin Authorization in production
app.use(cors());
app.use(express.json());

// --- SYSTEM HEALTH MONITORING ---
app.get('/api/admin/health', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    const network = await si.networkStats();
    
    // Simulate DB latency and health
    const start = Date.now();
    const dbStatus = await checkDatabase(); 
    const dbLatency = Date.now() - start;
    
    res.json({
      cpu: cpu.currentLoad.toFixed(2),
      ram: {
        total: mem.total,
        used: mem.active,
        percent: ((mem.active / mem.total) * 100).toFixed(2)
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: d.size,
        used: d.used,
        percent: d.use,
        mount: d.mount
      })),
      network: network.length > 0 ? {
        rx: (network[0].rx_sec / 1024).toFixed(2),
        tx: (network[0].tx_sec / 1024).toFixed(2)
      } : { rx: 0, tx: 0 },
      database: {
        status: dbStatus,
        latency: dbLatency,
        storage: '2.4 GB' // Mocked storage usage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System Info Error:', error);
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
});

// --- ONE-CLICK FIXES ---
app.post('/api/admin/restart/:service', (req, res) => {
  const { service } = req.params;
  
  let command = '';
  switch(service) {
    case 'traccar':
      // Adjust based on host OS (Linux vs Windows)
      command = process.platform === 'win32' ? 'net stop traccar && net start traccar' : 'sudo systemctl restart traccar';
      break;
    case 'database':
      command = process.platform === 'win32' ? 'net stop postgresql-x64-15 && net start postgresql-x64-15' : 'sudo systemctl restart postgresql';
      break;
    case 'backend':
      command = 'pm2 restart geosurepath-admin-api';
      break;
    case 'cache':
      command = process.platform === 'win32' ? 'redis-cli flushall' : 'redis-cli flushall';
      break;
    default:
      return res.status(400).json({ error: 'Unknown service' });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Exec Error: ${error}`);
        return res.status(500).json({ error: `Failed to restart ${service}: ${stderr}` });
    }
    res.json({ message: `Successfully restarted ${service}`, details: stdout });
  });
});

// Mock Database check
const checkDatabase = () => {
    return new Promise((resolve) => {
        // Here you would run a simple query like SELECT 1;
        // Simulating success
        setTimeout(() => resolve('ONLINE'), 100);
    });
};

app.listen(PORT, () => {
  console.log(`GeoSurePath Admin API running on port ${PORT}`);
});
