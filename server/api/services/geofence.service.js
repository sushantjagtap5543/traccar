const Geofence = require("../models/Geofence");
const Device = require("../models/Device");

exports.createGeofence = async (data) => {
  const geofence = new Geofence(data);
  return await geofence.save();
};

exports.getAllGeofences = async () => {
  return await Geofence.find();
};

exports.deleteGeofence = async (id) => {
  return await Geofence.findByIdAndDelete(id);
};

exports.assignGeofenceToDevice = async (geofenceId, deviceId) => {
  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");
  
  if (!device.geofences.includes(geofenceId)) {
    device.geofences.push(geofenceId);
    await device.save();
  }
  return device;
};
