import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import { getPositions } from "../services/deviceService";
import { Map as MapIcon, Activity, ShieldCircle, Clock } from "lucide-react";
import socketService from "../services/socketService";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({ active: 0, offline: 0, alerts: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPositions();
        setPositions(data);
        setStats(prev => ({ ...prev, active: data.length }));
      } catch (err) {
        console.error("Failed to fetch positions", err);
      }
    };
    fetchData();

    // Listen for real-time updates
    socketService.on("position_update", (newPos) => {
      setPositions(prev => {
        const index = prev.findIndex(p => p.deviceId === newPos.deviceId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newPos };
          return updated;
        }
        return [...prev, newPos];
      });
    });

    return () => socketService.off("position_update");
  }, []);

  return (
    <div className="dashboard-page animate-fade-in">
      <header className="page-header">
        <div className="header-left">
          <h2>Vehicle Dashboard</h2>
          <p>Real-time location monitoring and status</p>
        </div>
        <StatusBadge />
      </header>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon active"><Activity size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Active Devices</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon alerts"><ShieldCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Security Alerts</span>
            <span className="stat-value">{stats.alerts}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon fleet"><MapIcon size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Fleet</span>
            <span className="stat-value">{stats.active + stats.offline}</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon uptime"><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">System Uptime</span>
            <span className="stat-value">99.9%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <MapView positions={positions} />
      </div>

    </div>
  );
}
