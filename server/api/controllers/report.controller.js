const db = require("../../config/database");

exports.getTrips = async (req, res) => {
  const { deviceId, from, to } = req.query;
  // Implementation for fetching trips from DB
  const trips = await db.reports.findTrips({ deviceId, from, to });
  res.json(trips);
};

exports.getStops = async (req, res) => {
  const { deviceId, from, to } = req.query;
  // Implementation for fetching stops from DB
  const stops = await db.reports.findStops({ deviceId, from, to });
  res.json(stops);
};

exports.getSummary = async (req, res) => {
  const { deviceId, from, to } = req.query;
  // Implementation for fetching summary from DB
  const summary = await db.reports.getSummary({ deviceId, from, to });
  res.json(summary);
};
