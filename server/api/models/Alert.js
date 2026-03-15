const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  type: { 
    type: String, 
    enum: ["geofence_enter", "geofence_exit", "overspeed", "low_battery", "sos"],
    required: true 
  },
  message: { type: String, required: true },
  location: {
    latitude: Number,
    longitude: Number
  },
  severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["active", "dismissed"], default: "active" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", AlertSchema);
