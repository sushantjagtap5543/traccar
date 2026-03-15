const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["online", "offline", "unknown"], default: "unknown" },
  lastUpdate: { type: Date, default: Date.now },
  speedLimit: { type: Number, default: 80 },
  geofences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Geofence" }],
  position: {
    latitude: Number,
    longitude: Number,
    address: String
  }
});

module.exports = mongoose.model("Device", DeviceSchema);
