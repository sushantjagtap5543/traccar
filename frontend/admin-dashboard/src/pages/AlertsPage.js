import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Bell, ShieldAlert, Clock, Smartphone, MoreVertical, Trash2, CheckCircle2 } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    setLoading(true);
    api("/api/events") 
      .then(res => {
        setAlerts(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch alerts", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleClear = () => {
    if (!window.confirm("Purge all recorded tactical system violations from the archived session?")) return;
    api("/api/events/clear", { method: 'POST' })
        .then(() => fetchAlerts())
        .catch(err => alert(err.message));
  };

  const handleAcknowledge = (id) => {
    api(`/api/events/${id}`, { method: 'DELETE' })
        .then(() => fetchAlerts())
        .catch(err => alert(err.message));
  };

  return (
    <div className="alerts-page animate-fade-in">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px' }}>System Violations</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Real-time event feed for all fleet assets and geozone breaches.</p>
          </div>
          <button className="btn glass-bright" style={{ color: 'var(--danger)' }} onClick={handleClear}>
              <Trash2 size={18} /> Clear Session Logs
          </button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="glass card" style={{ padding: '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--danger)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 75, 108, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                       <ShieldAlert size={28} />
                    </div>
                    <div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{alert.type?.replace(/([A-Z])/g, ' $1').trim() || "System Violation"}</h3>
                          <span className="badge badge-danger">High Priority</span>
                       </div>
                       <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Smartphone size={14} /> Asset ID: {alert.deviceId}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Clock size={14} /> {new Date(alert.eventTime).toLocaleString()}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem' }} onClick={() => handleAcknowledge(alert.id)}>Acknowledge</button>
                    <button className="btn glass-bright" style={{ padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }} onClick={() => window.location.href=`/admin/reports?deviceId=${alert.deviceId}`}>Investigate</button>
                    <button className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)' }}><MoreVertical size={20} /></button>
                 </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '5rem', textAlign: 'center', borderRadius: '32px' }}>
                {loading ? (
                    <div className="animate-pulse text-slate-400">Synchronizing system logs...</div>
                ) : (
                    <>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--success)' }}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Compromises Detected</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>All systems are currently operational and within specified geozone parameters. No violations archived in recent session.</p>
                    </>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


