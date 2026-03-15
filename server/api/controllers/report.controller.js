const reportService = require("../services/report.service");

exports.getTrips = async (req, res) => {
  try {
    const { deviceId, from, to } = req.query;
    const trips = await reportService.detectTrips(deviceId, from, to);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStops = async (req, res) => {
  try {
    const { deviceId, from, to } = req.query;
    const stops = await reportService.detectStops(deviceId, from, to);
    res.json(stops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { deviceId, from, to } = req.query;
    const summary = await reportService.getSummaryAnalytics(deviceId, from, to);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type, deviceId, from, to, format } = req.query;
    // Implementation for generating and sending file would go here
    res.json({ message: `Exporting ${type} report in ${format} format...`, status: "pending" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
