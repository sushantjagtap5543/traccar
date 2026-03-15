const Alert = require("../models/Alert");

/**
 * Checks if a point (lat, lng) is inside a circular geofence
 */
exports.isPointInCircle = (lat, lng, centerLat, centerLng, radius) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLng = (lng - centerLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance <= radius;
};

/**
 * Checks if a point (lat, lng) is inside a polygonal geofence using Ray Casting algorithm
 */
exports.isPointInPolygon = (lat, lng, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].latitude, yi = points[i].longitude;
    const xj = points[j].latitude, yj = points[j].longitude;
    
    const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Creates and broadcasts an alert
 */
exports.triggerAlert = async (io, deviceId, type, message, location) => {
  const alert = new Alert({
    deviceId,
    type,
    message,
    location
  });
  await alert.save();
  
  // Broadcast alert to room
  io.to(deviceId.toString()).emit("alert", alert);
  console.log(`Alert Triggered for ${deviceId}: ${type} - ${message}`);
  return alert;
};
