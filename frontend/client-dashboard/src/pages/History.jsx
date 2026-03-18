import { useState, useEffect } from "react";
import { Search, Calendar, Clock, MapPin, ChevronRight, Filter, Download, Play, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getDevices } from "../services/deviceService";
import api from "../services/api";
import Loader from "../components/Loader";

function MapController({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);
    return null;
}

export default function History() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
      if (data.length > 0) setSelectedDevice(data[0]);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedDevice) return;
    
    setSearching(true);
    try {
      // Real API call to fetch historical telemetry
      const res = await api.get(`/positions?deviceId=${selectedDevice.id}&from=${dateRange.start}T00:00:00Z&to=${dateRange.end}T23:59:59Z`);
      setHistoryData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Tactical trace failed: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const polylineCoords = historyData.map(p => [p.latitude, p.longitude]);

  if (loading) return <Loader />;

  return (
    <div className="history-page animate-fade-in" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Intelligence History</h2>
          <p style={{ color: 'var(--text-muted)' }}>Review historical asset deployment and telemetry logs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-icon glass-bright" title="Export Data"><Download size={20} /></button>
            <button className="btn-icon glass-bright" title="Filter Criteria"><Filter size={20} /></button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 400px) 1fr', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Control Panel */}
        <div className="glass widget-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Asset Configuration</label>
            <div className="input-group">
                <Search size={18} className="input-icon" />
                <select 
                    value={selectedDevice?.id || ""} 
                    onChange={(e) => setSelectedDevice(devices.find(d => d.id === parseInt(e.target.value)))}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', cursor: 'pointer' }}
                >
                    {devices.map(d => <option key={d.id} value={d.id} style={{ background: '#1e293b' }}>{d.name}</option>)}
                </select>
            </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Deployment Window</label>
             <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                <Calendar size={18} className="input-icon" />
                <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} 
                />
             </div>
             <div className="input-group">
                <Clock size={18} className="input-icon" />
                <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} 
                />
             </div>
          </div>

          <button className="btn-primary" onClick={handleSearch} style={{ width: '100%' }} disabled={searching}>
            <Play size={18} /> {searching ? "Tracing..." : "Reconstruct Tactical Route"}
          </button>

          {historyData.length > 0 && (
            <div className="playback-controller glass-bright mt-4" style={{ padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--primary-glow)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>PLAYBACK MODULE</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{historyData.length} Data Points</span>
               </div>
               
               <input type="range" max={historyData.length - 1} style={{ width: '100%', accentColor: 'var(--primary)', height: '4px', appearance: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', cursor: 'ew-resize' }} />
               
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
                  <button className="btn-icon glass-bright"><ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /></button>
                  <button className="btn-icon glass-bright" style={{ width: '48px', height: '48px', color: 'var(--primary)', background: 'rgba(6,182,212,0.1)' }}><Play size={24} fill="currentColor" /></button>
                  <button className="btn-icon glass-bright"><ChevronRight size={18} /></button>
               </div>
            </div>
          )}
        </div>

        {/* Right Data Display - Real Tactical History Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass widget-card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapController positions={historyData} />
                    {polylineCoords.length > 0 && (
                        <>
                            <Polyline positions={polylineCoords} color="var(--primary)" weight={3} opacity={0.6} />
                            <Marker position={polylineCoords[0]}>
                                <Popup>Deployment Start Point</Popup>
                            </Marker>
                            <Marker position={polylineCoords[polylineCoords.length - 1]}>
                                <Popup>Last Recorded Position</Popup>
                            </Marker>
                        </>
                    )}
                </MapContainer>
            </div>
            
            <div className="glass widget-card" style={{ height: '300px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Telemetry Archive</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{historyData.length} records found</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {historyData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {historyData.map((item, idx) => (
                            <div key={idx} className="device-item glass-bright" style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Navigation size={20} style={{ transform: `rotate(${item.course}deg)` }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(item.serverTime).toLocaleString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{item.speed?.toFixed(1) || 0}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>km/h</div>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', opacity: 0.5 }}>
                           <p>Awaiting tactical trace initialization...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

