import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api("/api/reports/events") // Generic Traccar event endpoint for alerts
      .then(setAlerts)
      .catch(err => console.error("Failed to fetch alerts", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Device Alerts</h2>
      {alerts.length === 0 ? (
        <p>No recent alerts found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {alerts.map((alert) => (
            <li 
              key={alert.id} 
              style={{ 
                padding: "15px", 
                marginBottom: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "8px",
                backgroundColor: "#fff5f5"
              }}
            >
              <strong>{alert.type}</strong> - Device ID: {alert.deviceId}
              <br />
              <small>{new Date(alert.eventTime).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
