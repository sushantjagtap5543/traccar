const DeviceService = require("../services/deviceService");

exports.createDevice = async (req, res) => {
  try {
    const device = await DeviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const devices = await DeviceService.getAllDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await DeviceService.updateDevice(req.params.id, req.body);
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    await DeviceService.deleteDevice(req.params.id);
    res.json({ message: "Device deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignDevice = async (req, res) => {
  try {
    const { deviceId, userId } = req.body;
    const user = await DeviceService.assignDeviceToUser(deviceId, userId);
    res.json({ message: "Device assigned successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
