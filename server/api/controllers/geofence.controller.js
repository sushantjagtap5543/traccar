const geofenceService = require("../services/geofence.service");

exports.createGeofence = async (req, res) => {
  try {
    const geofence = await geofenceService.createGeofence(req.body);
    res.status(201).json(geofence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGeofences = async (req, res) => {
  try {
    const geofences = await geofenceService.getAllGeofences();
    res.json(geofences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteGeofence = async (req, res) => {
  try {
    await geofenceService.deleteGeofence(req.params.id);
    res.json({ message: "Geofence deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignGeofence = async (req, res) => {
  try {
    const { geofenceId, deviceId } = req.body;
    const device = await geofenceService.assignGeofenceToDevice(geofenceId, deviceId);
    res.json({ message: "Geofence assigned to device", device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
