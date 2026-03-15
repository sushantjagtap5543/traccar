import React, { useState } from "react";
import { api } from "../api/client";

export default function ReportsPage() {
  const [deviceId, setDeviceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const result = await api(`/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`);
      setData(result);
    } catch (err) {
      alert("Failed to generate report");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Historical Reports</h2>
      <form onSubmit={handleGenerate} style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input 
          placeholder="Device ID" 
          value={deviceId} 
          onChange={e => setDeviceId(e.target.value)} 
          style={{ padding: "8px" }}
        />
        <input 
          type="datetime-local" 
          value={from} 
          onChange={e => setFrom(e.target.value)} 
          style={{ padding: "8px" }}
        />
        <input 
          type="datetime-local" 
          value={to} 
          onChange={e => setTo(e.target.value)} 
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}>
          Generate Report
        </button>
      </form>

      {data.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
              <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Device</th>
              <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Distance</th>
              <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Average Speed</th>
              <th style={{ padding: "12px", border: "1px solid #dee2e6" }}>Max Speed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{item.deviceName}</td>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{(item.distance / 1000).toFixed(2)} km</td>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{item.averageSpeed.toFixed(1)} km/h</td>
                <td style={{ padding: "12px", border: "1px solid #dee2e6" }}>{item.maxSpeed.toFixed(1)} km/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
