import { ChevronRight, Battery, Wifi, MapPin } from "lucide-react";

export default function DeviceCard({ device }) {
  const statusColor = device.status === "online" ? "var(--success)" : "var(--text-muted)";

  return (
    <div className="device-card glass animate-fade-in">
      <div className="card-header">
        <div className="device-info">
          <div className="status-indicator" style={{ backgroundColor: statusColor }}></div>
          <h3>{device.name}</h3>
        </div>
        <ChevronRight size={20} className="arrow-icon" />
      </div>
      
      <div className="card-body">
        <div className="detail-item">
          <MapPin size={16} />
          <span>ID: {device.uniqueId}</span>
        </div>
        <div className="detail-item">
          <Battery size={16} />
          <span>Battery: 85%</span>
        </div>
        <div className="detail-item">
          <Wifi size={16} />
          <span>Signal: Strong</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="last-update">Last seen: 2 mins ago</span>
        <button className="view-btn">View Details</button>
      </div>

    </div>
  );
}
