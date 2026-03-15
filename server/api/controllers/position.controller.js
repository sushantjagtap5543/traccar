const db = require("../../config/database");
const Position = require("../models/Position");
const Device = require("../models/Device");
const { isPointInCircle, isPointInPolygon, triggerAlert } = require("../utils/alerts");

exports.updatePosition = (io) => async (req, res) => {
  try {
    const { deviceId, latitude, longitude, speed, address } = req.body;

    // 1. Fetch Device with Geofences
    const device = await Device.findById(deviceId).populate("geofences");
    if (!device) return res.status(404).json({ message: "Device not found" });

    // 2. Geofence Check
    for (const gf of device.geofences) {
      let inside = false;
      if (gf.type === "circle") {
        inside = isPointInCircle(latitude, longitude, gf.coordinates.center.latitude, gf.coordinates.center.longitude, gf.coordinates.radius);
      } else {
        inside = isPointInPolygon(latitude, longitude, gf.coordinates.points);
      }

      // Check for exit (Exit alert)
      // Note: In a production app, you'd compare with previous status to detect the moment of exit/entry
      if (!inside) {
        await triggerAlert(io, deviceId, "geofence_exit", `Device left geofence: ${gf.name}`, { latitude, longitude });
      }
    }

    // 3. Speed Check
    if (speed > device.speedLimit) {
      await triggerAlert(io, deviceId, "overspeed", `Speed limit exceeded: ${speed} km/h`, { latitude, longitude });
    }

    // 4. Save Position
    const position = new Position({ deviceId, latitude, longitude, speed, address });
    await position.save();

    // 5. Update Device
    device.lastUpdate = Date.now();
    device.status = "online";
    device.position = { latitude, longitude, address };
    await device.save();

    // 6. Broadcast position
    io.to(deviceId.toString()).emit("positionUpdate", position);

    res.status(200).json(position);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
