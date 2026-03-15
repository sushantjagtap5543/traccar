import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClientId, setNewClientId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = () => {
    setLoading(true);
    api("/api/devices?all=true")
      .then(data => {
        setDevices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleTransfer = (deviceId) => {
    if (!newClientId) return alert("Please enter a Client ID");
    api(`/api/devices/transfer?deviceId=${deviceId}&newClientId=${newClientId}`, {
      method: 'POST'
    }).then(() => {
      alert("Device transferred successfully");
      setNewClientId("");
      setSelectedDeviceId(null);
      fetchDevices();
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Device Management</h1>
          <button className="btn btn-primary" onClick={() => fetchDevices()}>Refresh</button>
        </div>

        <div className="card">
          {loading ? (
            <p>Loading devices...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Unique ID</th>
                  <th>Client ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id}>
                    <td>{device.id}</td>
                    <td>{device.name}</td>
                    <td>{device.uniqueId}</td>
                    <td>{device.userId || "Unassigned"}</td>
                    <td>
                      <span className={`badge ${device.status === 'online' ? 'badge-success' : 'badge-danger'}`}>
                        {device.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="number" 
                          placeholder="Client ID" 
                          style={{ background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '0.25rem', borderRadius: '4px', width: '80px' }}
                          onChange={(e) => {
                            setSelectedDeviceId(device.id);
                            setNewClientId(e.target.value);
                          }}
                        />
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleTransfer(device.id)}>
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
