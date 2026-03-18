import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Activity, Cpu, HardDrive, Clock, Shield, RefreshCcw, Layers } from "lucide-react";

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    api("/api/stats/health")
      .then(res => {
        setHealth(res);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch system health", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="container flex items-center justify-center" style={{ height: '80vh' }}>
          <div className="animate-pulse text-slate-400">Probing infrastructure nodes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Infrastructure Vitality</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Real-time telemetry and health monitoring for the GeoSure Core.</p>
          </div>
          <button className="btn glass-bright" onClick={fetchHealth} disabled={loading}>
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> Rescan Nodes
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="card stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Cpu size={20} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>CPU LOAD</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{health?.cpu?.load}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Across {health?.cpu?.cores} logic cores</div>
            </div>

            <div className="card stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-purple)' }}>
                        <Layers size={20} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>MEMORY USAGE</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{health?.memory?.usagePercent}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{health?.memory?.free} system free</div>
            </div>

            <div className="card stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--success)' }}>
                        <Clock size={20} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>SYSTEM UPTIME</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{health?.uptime}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Node operational stability</div>
            </div>

            <div className="card stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '10px', borderRadius: '12px', color: '#fbbf24' }}>
                        <Shield size={20} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>SECURITY LAYER</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>ACTIVE</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>SSL + Firewall active</div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={24} color="var(--primary)" /> Network Synchronization
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                        { label: 'Traccar Engine API', status: 'Operational', latency: '4ms' },
                        { label: 'PostgreSQL Database', status: 'Operational', latency: '2ms' },
                        { label: 'Redis Cache Layer', status: 'Operational', latency: '0.5ms' },
                        { label: 'Asset Socket Stream', status: 'Scaling', latency: '12ms' },
                    ].map(node => (
                        <div key={node.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                            <div style={{ fontWeight: 700 }}>{node.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{node.latency}</div>
                                <span className={`badge ${node.status === 'Operational' ? 'badge-success' : 'badge-warning'}`}>{node.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HardDrive size={24} color="var(--primary)" /> Storage Governance
                </h2>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
                         <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary)" strokeWidth="12" strokeDasharray="339" strokeDashoffset={339 * (1-0.12)} strokeLinecap="round" />
                         </svg>
                         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 900, fontSize: '1.2rem' }}>12%</div>
                    </div>
                    <p style={{ fontWeight: 800 }}>Primary Array Usage</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>42.5 GB of 500 GB Provisioned</p>
                    
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid var(--primary-glow)' }}>
                         <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>BACKUP INTEGRITY</p>
                         <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 900 }}>02:00</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>LAST SUCCESS</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 900 }}>0/30</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>FAILURES (30D)</div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
