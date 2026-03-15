const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["trips", "stops", "summary"], required: true },
  criteria: {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    from: Date,
    to: Date
  },
  format: { type: String, enum: ["json", "pdf", "excel"], default: "json" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", ReportSchema);
