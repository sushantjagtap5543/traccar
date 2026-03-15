import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon issues in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 20.5937) { // Only center if not default
      map.setView(center, zoom);
    }
  }, []); // Run only on mount
  return null;
}

export default function MapView({ positions = [] }) {
  const center = positions.length > 0 
    ? [positions[0].latitude, positions[0].longitude] 
    : [20.5937, 78.9629]; // Default to India

  return (
    <div className="map-wrapper animate-fade-in shadow-lg">
      <MapContainer 
        center={center} 
        zoom={5} 
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      >
        <ChangeView center={center} zoom={5} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{y}.png"
        />
        {positions.map((pos) => (
          <Marker key={pos.id || pos.deviceId} position={[pos.latitude, pos.longitude]}>
            <Popup>
              <div className="popup-content">
                <strong>Device ID: {pos.deviceId}</strong><br />
                Speed: {pos.speed} knots<br />
                Last Update: {new Date(pos.deviceTime).toLocaleString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </div>
  );
}
