const db = require("../../config/database");

exports.getLatestPositions = async (req, res) => {
  const userId = req.user.id;
  // In reality, join with devices owned by user
  const positions = await db.positions.find({
    userId: userId
  });
  res.json(positions);
};

exports.getPositionHistory = async (req, res) => {
  const { deviceId } = req.query;
  const { from, to } = req.query;
  
  // Verify device ownership first
  const device = await db.devices.findOne({ id: deviceId, ownerId: req.user.id });
  if (!device) {
    return res.status(403).json({ message: "Access denied to this device" });
  }

  const history = await db.positions.find({
    deviceId,
    time: { $gte: from, $lte: to }
  });
  res.json(history);
};
