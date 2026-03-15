const Position = require("../models/Position");

/**
 * Groups GPS positions into trips based on movement and time thresholds
 */
exports.detectTrips = async (deviceId, from, to) => {
  const positions = await Position.find({
    deviceId,
    timestamp: { $gte: new Date(from), $lte: new Date(to) }
  }).sort({ timestamp: 1 });

  const trips = [];
  let currentTrip = null;
  const TRIP_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes gap marks a new trip
  const SPEED_THRESHOLD = 5; // 5 km/h

  positions.forEach((p, index) => {
    const isMoving = p.speed > SPEED_THRESHOLD;

    if (isMoving && !currentTrip) {
      // Start of a new trip
      currentTrip = {
        deviceId,
        start: p.timestamp,
        startLocation: { latitude: p.latitude, longitude: p.longitude, address: p.address },
        points: [p]
      };
    } else if (currentTrip) {
      const lastPoint = currentTrip.points[currentTrip.points.length - 1];
      const timeGap = p.timestamp - lastPoint.timestamp;

      if (timeGap > TRIP_THRESHOLD_MS || (!isMoving && index === positions.length - 1)) {
        // End of trip
        currentTrip.end = lastPoint.timestamp;
        currentTrip.endLocation = { latitude: lastPoint.latitude, longitude: lastPoint.longitude, address: lastPoint.address };
        currentTrip.duration = (currentTrip.end - currentTrip.start) / 1000 / 60; // minutes
        
        // Calculate distance (simplified)
        currentTrip.distance = currentTrip.points.length * 0.1; // Placeholder for actual haversine distance calc

        const { points, ...tripData } = currentTrip;
        trips.push(tripData);
        currentTrip = null;
      } else {
        currentTrip.points.push(p);
      }
    }
  });

  return trips;
};

/**
 * Identifies stationary periods
 */
exports.detectStops = async (deviceId, from, to) => {
  const positions = await Position.find({
    deviceId,
    timestamp: { $gte: new Date(from), $lte: new Date(to) }
  }).sort({ timestamp: 1 });

  const stops = [];
  const STOP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes stationary
  const SPEED_THRESHOLD = 2; // Under 2 km/h is stationary

  let stopStart = null;

  positions.forEach((p, index) => {
    const isStationary = p.speed < SPEED_THRESHOLD;

    if (isStationary && !stopStart) {
      stopStart = p;
    } else if (!isStationary && stopStart) {
      const duration = p.timestamp - stopStart.timestamp;
      if (duration >= STOP_THRESHOLD_MS) {
        stops.push({
          deviceId,
          from: stopStart.timestamp,
          to: p.timestamp,
          duration: duration / 1000 / 60, // minutes
          location: { latitude: stopStart.latitude, longitude: stopStart.longitude, address: stopStart.address }
        });
      }
      stopStart = null;
    }
  });

  return stops;
};

/**
 * Calculates summary metrics
 */
exports.getSummaryAnalytics = async (deviceId, from, to) => {
  const positions = await Position.find({
    deviceId,
    timestamp: { $gte: new Date(from), $lte: new Date(to) }
  });

  if (positions.length === 0) return { totalDistance: 0, maxSpeed: 0, averageSpeed: 0, positionCount: 0 };

  const maxSpeed = Math.max(...positions.map(p => p.speed || 0));
  const avgSpeed = positions.reduce((acc, p) => acc + (p.speed || 0), 0) / positions.length;

  return {
    deviceId,
    totalDistance: positions.length * 0.1, // Placeholder
    maxSpeed,
    averageSpeed: avgSpeed.toFixed(2),
    positionCount: positions.length,
    period: { from, to }
  };
};
