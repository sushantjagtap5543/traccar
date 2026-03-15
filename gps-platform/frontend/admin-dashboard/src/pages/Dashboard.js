import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    unassigned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/devices")
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch stats", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen text-white">
        <Navbar />
        <div className="container">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Fleet Overview</h1>
        
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">Total Devices</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Online</div>
            <div className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.online}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Offline</div>
            <div className="stat-value" style={{ color: 'var(--danger-color)' }}>{stats.offline}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Unassigned</div>
            <div className="stat-value" style={{ color: 'var(--warning-color)' }}>{stats.unassigned}</div>
          </div>
        </div>

        <div className="card">
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => window.location.href='/devices'}>Manage Devices</button>
            <button className="btn" style={{ background: '#334155', color: 'white' }} onClick={() => window.location.href='/reports'}>View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}
