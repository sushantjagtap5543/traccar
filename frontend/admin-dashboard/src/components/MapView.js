import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Smartphone, Activity, MapPin, Gauge } from 'lucide-react';

import { getVehicleIcon } from '../utils/markers';

// Create premium marker icons with category and heading support
const createMarkerIcon = (online, course, category, color) => L.divIcon({
  html: getVehicleIcon(category, color, course, online),
  className: 'custom-leaflet-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapController({ devices }) {
  const map = useMap();
  const firstLoad = useRef(true);

  useEffect(() => {
    const validDevices = devices.filter(d => d.lat && d.lng);
    if (validDevices.length > 0 && firstLoad.current) {
      const bounds = L.latLngBounds(validDevices.map(d => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      firstLoad.current = false;
    }
  }, [devices, map]);

  return null;
}

export default function MapView({ devices = [] }) {
  const defaultCenter = [20.5937, 78.9629]; // Center of India

  return (
    <div className="map-view-wrapper" style={{ height: "100%", width: "100%", position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapController devices={devices} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {devices.map((device) => {
          if (!device.lat || !device.lng) return null;
          const isOnline = device.status === 'online';
          
          return (
            <Marker 
              key={device.id} 
              position={[device.lat, device.lng]}
              icon={createMarkerIcon(isOnline, device.course, device.category, device.color)}
            >
              <Popup className="premium-popup">
                <div className="popup-card" style={{ padding: '8px', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                     <div style={{ 
                       width: '32px', height: '32px', borderRadius: '8px', 
                       background: isOnline ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 75, 108, 0.1)', 
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       color: isOnline ? 'var(--primary)' : 'var(--danger)'
                     }}>
                        <Smartphone size={18} />
                     </div>
                     <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{device.name}</h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {String(device.id).substring(0, 8)}</span>
                     </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</span>
                       <span style={{ color: isOnline ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>{device.status.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>SPEED</span>
                       <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem' }}>{device.speed || 0} km/h</span>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                     <button className="btn-primary" style={{ flex: 1, padding: '8px 0', fontSize: '0.75rem', height: 'auto', borderRadius: '8px' }} onClick={() => window.location.href=`/admin/reports?deviceId=${device.id}`}>
                        Intelligence
                     </button>
                     <button className="btn glass-bright" style={{ flex: 1, padding: '8px 0', fontSize: '0.75rem', height: 'auto', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }} onClick={() => window.location.href=`/admin/devices`}>
                        Control
                     </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}


