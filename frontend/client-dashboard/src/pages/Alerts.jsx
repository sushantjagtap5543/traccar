import { useState, useEffect } from "react";
import { AlertTriangle, Bell, Trash2, CheckCircle, Search, Filter, Clock, MapPin, ShieldAlert } from "lucide-react";
import api from "../services/api";
import Loader from "../components/Loader";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/events");
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const handlAcknowledge = async (id) => {
    try {
        await api.delete(`/events/${id}`);
        setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
        alert("Action failed: " + err.message);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Purge all tactical violation logs?")) return;
    try {
        await api.delete("/events");
        setAlerts([]);
    } catch (err) {
        alert("Operation failed: " + err.message);
    }
  };

  const getAlertIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'overspeed': return { icon: <AlertTriangle size={24} />, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'geofenceentry': return { icon: <MapPin size={24} />, color: 'var(--primary)', bg: 'rgba(6, 182, 212, 0.1)' };
      case 'ignitionon': return { icon: <Bell size={24} />, color: 'var(--amber)', bg: 'rgba(245, 158, 11, 0.1)' };
      default: return { icon: <Bell size={24} />, color: 'var(--text-dim)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.type?.toLowerCase().includes(search.toLowerCase()) || 
    a.deviceName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="alerts-page animate-fade-in" style={{ padding: '2rem' }}>
       <header className="page-header mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Violation Command</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time audit log of fleet policy breaches and tactical events</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ background: 'var(--amber)', color: 'black' }}>
                <ShieldAlert size={18} /> Configure Proactive Rules
            </button>
            <button className="btn glass-bright" onClick={handleClear} style={{ color: 'var(--danger)' }}>
                <Trash2 size={18} /> Clear Session Logs
            </button>
        </div>
      </header>

      <div className="filters-bar glass mb-8" style={{ padding: '0.75rem 1.25rem', borderRadius: '18px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input 
            type="text" 
            placeholder="Search within tactical reports..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-icon"><Filter size={20} /></button>
      </div>

      <div className="alerts-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const style = getAlertIcon(alert.type);
            return (
              <div key={alert.id} className="glass alert-card hover-glow animate-slide-up" style={{ padding: '1.5rem', borderRadius: '24px', borderLeft: `6px solid ${style.color}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.color }}>
                            {style.icon}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{alert.type.toUpperCase()} VIOLATION</h3>
                                <span className="glass-bright" style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)' }}>#TACTICAL</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                Asset <span style={{ color: 'white', fontWeight: 700 }}>{alert.deviceName || `ID #${alert.deviceId}`}</span> breached protocol at speed <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{alert.speed || 0} km/h</span>.
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                                <Clock size={14} color="var(--primary)" /> {new Date(alert.eventTime).toLocaleTimeString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>{new Date(alert.eventTime).toLocaleDateString()}</div>
                        </div>
                        <button className="btn-primary" onClick={() => handlAcknowledge(alert.id)} style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                            <CheckCircle size={16} /> Acknowledge
                        </button>
                    </div>
                 </div>
              </div>
            );
          })
        ) : (
          <div className="glass widget-card mt-8" style={{ textAlign: 'center', padding: '5rem', borderRadius: '32px' }}>
            <div className="pulse-slow" style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(64, 255, 100, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
               <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.3 }} />
            </div>
            <h3>Airspace Secured</h3>
            <p style={{ color: 'var(--text-muted)' }}>No tactical violations detected across the active fleet registry.</p>
          </div>
        )}
      </div>

      <style>{`
        .hover-glow:hover {
            transform: translateX(10px);
            background: rgba(255,255,255,0.03);
            border-color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
