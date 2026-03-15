const mongoose = require("mongoose");

const GeofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["circle", "polygon"], default: "circle" },
  coordinates: {
    center: {
      latitude: Number,
      longitude: Number
    },
    radius: Number, // for circle (in meters)
    points: [{ latitude: Number, longitude: Number }] // for polygon
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Geofence", GeofenceSchema);
