const db = require("../../config/database");

exports.getAllDevices = async (userId) => {
  return await db.devices.find({ ownerId: userId });
};

exports.getDeviceById = async (id, userId) => {
  return await db.devices.findOne({ id: parseInt(id), ownerId: userId });
};

exports.createDevice = async (deviceData, userId) => {
  return await db.devices.insert({
    ...deviceData,
    ownerId: userId
  });
};

exports.updateDevice = async (id, deviceData, userId) => {
  return await db.devices.update(parseInt(id), {
    ...deviceData,
    ownerId: userId
  });
};

exports.deleteDevice = async (id) => {
  return await db.devices.delete(parseInt(id));
};
