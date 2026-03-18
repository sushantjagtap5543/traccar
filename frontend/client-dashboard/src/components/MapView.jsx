import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, LayersControl, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { Navigation, Clock, Gauge, Calendar, Battery, Signal, Zap, Map as MapIcon, Layers } from "lucide-react";

import { getVehicleIcon } from "../utils/markers";

function MapController({ selectedDevice, positions }) {
  const map = useMap();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (selectedDevice) {
      const pos = positions.find(p => p.deviceId === selectedDevice.id);
      if (pos) {
        map.flyTo([pos.latitude, pos.longitude], 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } else if (positions.length > 0 && firstLoad.current) {
        const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        firstLoad.current = false;
    }
  }, [selectedDevice, positions, map]);

  return null;
}

export default function MapView({ positions = [], selectedDevice }) {
  const defaultCenter = [20.5937, 78.9629]; // Center of India
  
  return (
    <div className="map-view-wrapper" style={{ height: "100%", width: "100%", position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <MapController selectedDevice={selectedDevice} positions={positions} />
        
        {/* Map-Specific Search Overlay */}
        <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 1000, pointerEvents: 'auto' }}>
            <div className="glass-bright" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 1.5rem', borderRadius: '14px', width: '320px', border: '1px solid var(--primary-glow)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <Search size={18} color="var(--primary)" />
                <input 
                  type="text" 
                  placeholder="Focus on asset..." 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                  onChange={(e) => {
                    const dev = positions.find(p => p.deviceName?.toLowerCase().includes(e.target.value.toLowerCase()));
                    if (dev) setSelectedDevice({ id: dev.deviceId });
                  }}
                />
            </div>
        </div>

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard Tactical">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite Imagery">
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/permissions/geoguidelines/">Google</a>'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {positions.map((pos, idx) => {
          const isOnline = (new Date() - new Date(pos.fixTime || pos.serverTime)) < 600000;
          
          // Anti-stacking logic (Spiderfy simulation via jitter)
          const isDuplicate = positions.slice(0, idx).some(p => p.latitude === pos.latitude && p.longitude === pos.longitude);
          const lat = isDuplicate ? pos.latitude + (Math.random() - 0.5) * 0.0001 : pos.latitude;
          const lng = isDuplicate ? pos.longitude + (Math.random() - 0.5) * 0.0001 : pos.longitude;

          const icon = L.divIcon({
            html: getVehicleIcon(pos.category || 'sedan', pos.color || 'cyan', pos.course, isOnline),
            className: 'custom-leaflet-marker',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          const attributes = pos.attributes || {};
          const battery = attributes.batteryLevel !== undefined ? `${attributes.batteryLevel}%` : (attributes.battery ? `${attributes.battery}V` : "N/A");
          const ignition = attributes.ignition === true || attributes.ign === true;
          const signal = attributes.rssi || attributes.signal || 0;

          return (
              <Marker 
                key={pos.id || pos.deviceId} 
                position={[lat, lng]}
                icon={icon}
              >
                {!ignition && (
                  <Tooltip permanent direction="top" offset={[0, -20]} className="ignition-off-tooltip">
                    <div style={{ background: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 900, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)' }}>
                        <Zap size={10} fill="white" /> IGNITION OFF
                    </div>
                  </Tooltip>
                )}
                <Popup className="premium-popup">
                <div className="popup-card" style={{ padding: '12px', minWidth: '240px' }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{pos.deviceName || `Asset ID #${pos.deviceId}`}</h3>
                      <span style={{ fontSize: '0.7rem', color: isOnline ? 'var(--success)' : 'var(--danger)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {isOnline ? "Active Link Established" : "Signal Synchronizing..."}
                      </span>
                    </div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--danger)', boxShadow: isOnline ? '0 0 10px var(--success)' : 'none' }}></div>
                  </header>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                    <div className="telem-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px' }}>
                      <Gauge size={14} color="var(--primary)" style={{ marginBottom: '4px' }}/>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{pos.speed.toFixed(0)} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>km/h</span></div>
                    </div>
                    <div className="telem-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px' }}>
                      <Battery size={14} color={attributes.batteryLevel < 20 ? 'var(--danger)' : 'var(--success)'} style={{ marginBottom: '4px' }}/>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{battery}</div>
                    </div>
                    <div className="telem-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px' }}>
                      <Signal size={14} color="var(--accent-purple)" style={{ marginBottom: '4px' }}/>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{signal} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>dbm</span></div>
                    </div>
                    <div className="telem-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px' }}>
                      <Zap size={14} color={ignition ? 'var(--amber)' : 'var(--text-dim)'} style={{ marginBottom: '4px' }}/>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: ignition ? 'var(--amber)' : 'inherit' }}>{ignition ? "IGNITION ON" : "IGNITION OFF"}</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '4px' }}>
                    <Clock size={12} style={{ marginRight: '4px' }} /> Last Fix: {new Date(pos.fixTime).toLocaleTimeString()}
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
