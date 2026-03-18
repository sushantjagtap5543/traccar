import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getVehicleIcon } from "../utils/markers";
import { ShieldCheck, Clock, MapPin, Activity } from "lucide-react";
import Loader from "../components/Loader";
import api from "../services/api";

export default function SharePortal() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/share/portal/${code}`);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling for public page
    return () => clearInterval(interval);
  }, [code]);

  if (loading) return <Loader />;
  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', color: 'white', textAlign: 'center', padding: '2rem' }}>
       <div className="glass" style={{ padding: '3rem', borderRadius: '32px' }}>
          <ShieldCheck size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2>Protocol Expired</h2>
          <p style={{ color: 'var(--text-dim)', maxWidth: '300px' }}>{error}</p>
       </div>
    </div>
  );

  const { lastPosition, deviceName, expiresAt } = data;
  const isOnline = (new Date() - new Date(lastPosition.fixTime || lastPosition.serverTime)) < 600000;

  const icon = L.divIcon({
    html: getVehicleIcon('sedan', 'cyan', lastPosition.course, isOnline),
    className: 'custom-leaflet-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-deep)', color: 'white', overflow: 'hidden', position: 'relative' }}>
        <header className="glass" style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000, padding: '1rem 2rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={24} color="white" />
                </div>
                <div>
                   <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{deviceName}</h2>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                       <Activity size={12} color={isOnline ? 'var(--success)' : 'var(--danger)'} />
                       {isOnline ? 'LIVE TELEMETRY' : 'SIGNAL LOST'}
                   </div>
                </div>
            </div>
            <div className="glass-bright" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--primary)" />
                EXPIRES: {new Date(expiresAt).toLocaleTimeString()}
            </div>
        </header>

        <MapContainer 
          center={[lastPosition.latitude, lastPosition.longitude]} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[lastPosition.latitude, lastPosition.longitude]} icon={icon}>
            <Popup>
               <div style={{ color: 'black' }}>
                  <strong>{deviceName}</strong><br/>
                  Speed: {Math.round(lastPosition.speed * 1.852)} km/h
               </div>
            </Popup>
          </Marker>
        </MapContainer>

        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
             <div className="glass" style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} color="var(--primary)" /> 
                {lastPosition.address || 'Tactical Coordinate Synchronized'}
             </div>
        </div>
    </div>
  );
}
