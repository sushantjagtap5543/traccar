const Position = require("../models/Position");
const Device = require("../models/Device");

exports.receiveData = (io) => async (req, res) => {
  try {
    const { deviceId, latitude, longitude, speed, course, address } = req.body;

    // 1. Save Position
    const position = new Position({
      deviceId,
      latitude,
      longitude,
      speed,
      course,
      address
    });
    await position.save();

    // 2. Update Device status/position
    await Device.findByIdAndUpdate(deviceId, {
      lastUpdate: Date.now(),
      status: "online",
      position: { latitude, longitude, address }
    });

    // 3. Broadcast to Socket.io (Room based on deviceId)
    // Clients will join rooms corresponding to their assigned device IDs
    io.to(deviceId.toString()).emit("positionUpdate", {
      deviceId,
      latitude,
      longitude,
      speed,
      course,
      timestamp: position.timestamp
    });

    res.status(200).json({ status: "success", position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
