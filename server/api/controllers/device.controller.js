const deviceService = require("../services/device.service");

exports.getDevices = async (req, res) => {

  const userId = req.user.id;

  const devices = await deviceService.getAllDevices(userId);

  res.json(devices);

};

exports.addDevice = async (req, res) => {

  const device = await deviceService.createDevice(req.body, req.user.id);

  res.json(device);

};

exports.updateDevice = async (req, res) => {
  const { id } = req.params;
  const device = await deviceService.updateDevice(id, req.body, req.user.id);
  res.json(device);
};

exports.deleteDevice = async (req, res) => {
  const { id } = req.params;
  await deviceService.deleteDevice(id);
  res.status(204).send();
};
