const mongoose = require("mongoose");

const PositionSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  course: { type: Number, default: 0 },
  address: String,
  timestamp: { type: Date, default: Date.now }
});

PositionSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model("Position", PositionSchema);
