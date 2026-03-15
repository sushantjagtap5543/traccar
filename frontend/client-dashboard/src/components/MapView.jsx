import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

export default function MapView({ positions = [] }) {
  const center = positions.length > 0 
    ? [positions[0].latitude, positions[0].longitude] 
    : [20.5937, 78.9629];

  return (
    <div className="map-wrapper animate-fade-in shadow-lg">
      <MapContainer 
        center={center} 
        zoom={5} 
        style={{ height: "100%", width: "100%", borderRadius: "16px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{y}.png"
        />
        {positions.map((pos) => (
          <Marker key={pos.id || pos.deviceId} position={[pos.latitude, pos.longitude]}>
            <Popup>
              <div>Device: {pos.deviceId}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
