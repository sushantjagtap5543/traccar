const Device = require("../models/Device");
const User = require("../models/User");

exports.createDevice = async (data) => {
  const device = new Device(data);
  return await device.save();
};

exports.updateDevice = async (id, data) => {
  return await Device.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteDevice = async (id) => {
  return await Device.findByIdAndDelete(id);
};

exports.getAllDevices = async () => {
  return await Device.find();
};

exports.assignDeviceToUser = async (deviceId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  if (!user.devices.includes(deviceId)) {
    user.devices.push(deviceId);
    await user.save();
  }
  return user;
};
