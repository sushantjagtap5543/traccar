const express = require('express');
const http = require('http');
const { Server } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new Server({ noServer: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mockUser = {
  id: 1,
  name: 'Admin GeoSurePath',
  email: 'admin@geosurepath.com',
  administrator: true,
  deviceLimit: -1,
  userLimit: -1,
  deviceReadonly: false,
  limitCommands: false,
  poiLayer: null,
  attributes: {
    soundEvents: 'deviceOverspeed,deviceOnline,deviceOffline,geofenceEnter,geofenceExit,alarm',
    soundAlarms: 'sos,vibration,movement,lowSpeed,overspeed'
  },
};

const mockServer = {
  id: 1,
  registration: true,
  readonly: false,
  deviceReadonly: false,
  mapUrl: null,
  bingKey: null,
  mapboxKey: null,
  latitude: 0.0,
  longitude: 0.0,
  zoom: 0,
  twelveHourFormat: false,
  forceSettings: false,
  coordinateFormat: null,
  limitCommands: false,
  poiLayer: null,
  announcement: null,
  emailEnabled: true,
  geocoderEnabled: false,
  textEnabled: false,
  openIdEnabled: false,
  openIdForce: false,
  version: '6.0',
  language: 'en',
  logo: null,
  termsUrl: null,
  attributes: {}
};

const mockDevice = {
  id: 1,
  name: 'Demo Vehicle',
  uniqueId: '869727079043558',
  status: 'online',
  lastUpdate: new Date().toISOString(),
  positionId: 1,
  groupId: 0,
  phone: '',
  model: 'GT06',
  contact: '',
  category: 'car',
  disabled: false,
  attributes: {},
};

const mockPosition = {
  id: 1,
  deviceId: 1,
  protocol: 'gt06',
  deviceTime: new Date().toISOString(),
  fixTime: new Date().toISOString(),
  serverTime: new Date().toISOString(),
  outdated: false,
  valid: true,
  latitude: 18.5204,
  longitude: 73.8567,
  altitude: 0.0,
  speed: 45.0,
  course: 90.0,
  address: 'Pune, Maharashtra, India',
  accuracy: 0.0,
  network: null,
  attributes: {
    ignition: true,
    status: 123,
    distance: 1200,
    totalDistance: 45000,
    motion: true,
    batteryLevel: 85,
  },
};

app.get('/api/server', (req, res) => res.json(mockServer));
app.get('/api/session', (req, res) => res.json(mockUser));
app.get('/api/devices', (req, res) => res.json([mockDevice]));
app.get('/api/positions', (req, res) => res.json([mockPosition]));

// Command Handling
app.post('/api/commands/send', (req, res) => {
  const { deviceId, type, attributes } = req.body;
  console.log(`Received command for ${deviceId}: ${type}`, attributes);
  
  if (type === 'engineStop') {
    mockPosition.attributes.ignition = false;
    mockPosition.attributes.status = 'Engine Cut';
  } else if (type === 'engineResume') {
    mockPosition.attributes.ignition = true;
    mockPosition.attributes.status = 'Engine Restored';
  }
  
  res.status(202).json({ id: Math.floor(Math.random() * 1000) });
});

// Registration Mocking Support
app.post('/api/users', (req, res) => {
  const newUser = { id: 2, ...req.body, administrator: false };
  console.log('Mock: User Registered:', newUser);
  res.json(newUser);
});

app.post('/api/session', (req, res) => {
  console.log('Mock: Session Login created with body:', req.body);
  const email = req.body?.email || 'admin@geosurepath.com';
  res.json({ ...mockUser, id: 2, email });
});

app.post('/api/devices', (req, res) => {
  const newDevice = { id: Math.floor(Math.random() * 1000), status: 'online', ...req.body };
  console.log('Mock: Device Registered:', newDevice.name);
  res.json(newDevice);
});

app.post('/api/permissions', (req, res) => {
  console.log('Mock: Permissions mapped', req.body);
  res.status(204).send();
});

// Mocking permissions and other common endpoints to avoid 404/500
app.get('/api/attributes/computed', (req, res) => res.json([]));
app.get('/api/geofences', (req, res) => res.json([]));
app.get('/api/notifications', (req, res) => res.json([]));

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/api/socket') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('WS Client connected');
  
  const sendUpdate = () => {
    // Simulate movement
    mockPosition.latitude += (Math.random() - 0.5) * 0.001;
    mockPosition.longitude += (Math.random() - 0.5) * 0.001;
    mockPosition.fixTime = new Date().toISOString();
    
    // Update distance
    mockPosition.attributes.distance = (mockPosition.attributes.distance || 0) + 10;
    mockPosition.attributes.totalDistance = (mockPosition.attributes.totalDistance || 45000) + 10;

    const updates = { positions: [mockPosition] };

    // Occasionally send an alert
    if (Math.random() > 0.95) {
      const event = {
        id: Math.floor(Math.random() * 10000),
        deviceId: 1,
        type: 'deviceOverspeed',
        serverTime: new Date().toISOString(),
        attributes: { speed: 85, message: 'Overspeed Alert: 85 km/h' },
      };
      updates.events = [event];
    }

    ws.send(JSON.stringify(updates));
  };

  const interval = setInterval(sendUpdate, 2000);

  ws.on('close', () => {
    console.log('WS Client disconnected');
    clearInterval(interval);
  });
});

const PORT = 8082;
server.listen(PORT, () => {
  console.log(`Mock Traccar Backend running on port ${PORT}`);
});
