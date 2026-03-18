import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import { Map as MapIcon, RefreshCcw, Activity, Users, Smartphone, ShieldAlert, Filter, Clock, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    activeUsers: 0,
    dailyDistance: 0,
    overallDistance: 0,
    dailyTrips: 0,
    overallTrips: 0
  });
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await api("/api/admin/devices/dashboard");
      setStats(statsData);
      
      const devicesData = await api("/api/devices?all=true");
      setDevices(devicesData || []);

      const alertsData = await api("/api/events?limit=5");
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
           <div className="animate-pulse text-slate-400">Synchronizing system nodes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in">
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px' }}>Fleet Intelligence</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Enterprise control level: Command & Control overview of all operatives.</p>
          </div>
          <button className="btn glass-bright" onClick={fetchData}>
            <RefreshCcw size={18} /> Resync Nodes
          </button>
        </div>
        
        <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
          <div className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: '14px' }}>
                  <Smartphone color="var(--primary)" size={24} />
               </div>
               <span className="stat-label">Total Assets</span>
            </div>
            <div className="stat-value">{stats.totalVehicles}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered hardware IDs</div>
          </div>
          <div className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '14px' }}>
                  <Activity color="var(--success)" size={24} />
               </div>
               <span className="stat-label">System Online</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.onlineVehicles}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>Active data links</div>
          </div>
          <div className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ background: 'rgba(255, 75, 108, 0.1)', padding: '12px', borderRadius: '14px' }}>
                  <Activity color="var(--danger)" size={24} />
               </div>
               <span className="stat-label">Offline Nodes</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.offlineVehicles}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lost synchronization</div>
          </div>
          <div className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '12px', borderRadius: '14px' }}>
                  <Users color="var(--accent-purple)" size={24} />
               </div>
               <span className="stat-label">Total Operatives</span>
            </div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authorized access level</div>
          </div>
        </div>

        {/* New Tactical Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(255,255,255,0.05) 100%)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Distance Metrics (km)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>DAILY SESSION</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.dailyDistance?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>OVERALL HISTORICAL</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{stats.overallDistance?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.05) 0%, rgba(255,255,255,0.05) 100%)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Cycles (Trips)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>TODAY'S OPERATIONS</div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.dailyTrips || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>TOTAL FLEET CYCLES</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-purple)' }}>{stats.overallTrips || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
           <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <MapIcon size={28} color="var(--primary)" />
                    <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 800 }}>Tactical Deployment</h2>
                 </div>
                 <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    {['all', 'online', 'offline'].map((f) => (
                       <button 
                          key={f}
                          onClick={() => setFilter(f)}
                          style={{ 
                             padding: '6px 16px', 
                             borderRadius: '8px', 
                             fontSize: '0.75rem', 
                             fontWeight: 700, 
                             textTransform: 'uppercase',
                             background: filter === f ? 'var(--primary)' : 'transparent',
                             color: filter === f ? 'white' : 'var(--text-dim)',
                             border: 'none',
                             cursor: 'pointer',
                             transition: 'all 0.2s'
                          }}
                       >
                          {f}
                       </button>
                    ))}
                 </div>
              </div>
              <div className="card" style={{ padding: '0.5rem', height: '500px', overflow: 'hidden' }}>
                 <MapView devices={devices.filter(d => filter === 'all' || (filter === 'online' ? d.status === 'online' : d.status !== 'online'))} />
              </div>
           </div>

           <div className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                 <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={20} color="var(--danger)" /> Live Violations
                 </h3>
                 <button className="btn glass-bright" style={{ fontSize: '0.7rem', padding: '4px 10px' }} onClick={() => window.location.href='/admin/alerts'}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {alerts.length > 0 ? alerts.map((alert) => (
                    <div key={alert.id} style={{ padding: '1rem', background: 'rgba(255, 75, 108, 0.05)', borderRadius: '14px', borderLeft: '3px solid var(--danger)', position: 'relative' }}>
                       <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{alert.type?.replace(/([A-Z])/g, ' $1').trim()}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Asset ID: {alert.deviceId}</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Clock size={12} /> {new Date(alert.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <ChevronRight size={14} color="var(--text-muted)" />
                       </div>
                    </div>
                 )) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                       <ShieldAlert size={32} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
                       <div style={{ fontSize: '0.85rem' }}>No active violations detected</div>
                    </div>
                 )}
              </div>
              
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid var(--primary-glow)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', letterSpacing: '1px' }}>SYSTEM INTEGRITY</p>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>VERIFIED SECURE</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>Encryption layer active across all nodes</div>
              </div>
           </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(6, 182, 212, 0.03) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: 800 }}>Strategic Assets</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>Centralized management for all hardware and operatives.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => window.location.href='/admin/devices'}>Manage Assets</button>
              <button className="btn glass-bright" style={{ color: 'var(--text-muted)' }} onClick={() => window.location.href='/admin/reports'}>Operational Intelligence</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

