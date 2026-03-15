import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './KPIStats.css'; // Optional: for custom styling

function KPIStats() {
  const [stats, setStats] = useState({ totalDevices: 0, activeDevices: 0, tripsToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/dashboard/kpi')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching KPI stats:', err);
        setError('Failed to load statistics');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="kpi-stats-loading">Loading stats...</div>;
  if (error) return <div className="kpi-stats-error">{error}</div>;

  return (
    <div className="kpi-stats">
      <h3>KPI Overview</h3>
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Devices</span>
          <span className="kpi-value">{stats.totalDevices}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Active Devices</span>
          <span className="kpi-value">{stats.activeDevices}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Trips Today</span>
          <span className="kpi-value">{stats.tripsToday}</span>
        </div>
      </div>
    </div>
  );
}

export default KPIStats;
