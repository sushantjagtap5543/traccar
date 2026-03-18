import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Smartphone, RefreshCcw, ArrowRightLeft, Search, Filter, MoreVertical, Wifi, WifiOff, Target, Terminal, Settings, Shield, Zap, Power, RotateCcw, Activity } from "lucide-react";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: "", uniqueId: "", category: "sedan" });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState("all");

  useEffect(() => {
    fetchDevices();
    fetchUsers();
  }, []);

  const fetchDevices = () => {
    setLoading(true);
    api("/api/devices?all=true")
      .then(data => {
        setDevices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    api("/api/users")
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    api("/api/devices", {
      method: "POST",
      body: JSON.stringify(newDevice)
    }).then(() => {
      setIsAddModalOpen(false);
      setNewDevice({ name: "", uniqueId: "", category: "sedan" });
      fetchDevices();
    }).catch(err => alert(err.message));
  };

  const handleTransfer = (deviceId) => {
    const newClientId = allocations[deviceId];
    if (!newClientId) return alert("Select a valid Operative from the registry.");
    
    api(`/api/devices/transfer?deviceId=${deviceId}&newClientId=${newClientId}`, {
      method: 'POST'
    }).then(() => {
      alert("Asset successfully reallocated to target operative.");
      setAllocations({ ...allocations, [deviceId]: "" });
      fetchDevices();
    }).catch(err => {
      alert(err.message || "Strategic reallocation failed.");
    });
  };

  const handleAllocChange = (deviceId, value) => {
    setAllocations({ ...allocations, [deviceId]: value });
  };

  const handleUpdateDevice = (device) => {
    api(`/api/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify(device)
    }).then(() => {
      alert("Asset tactical profile synchronized successfully.");
      fetchDevices();
    }).catch(err => {
      alert(err.message || "Strategic profile update failed.");
    });
  };

  const handleSendCommand = async (commandType) => {
    if (!selectedDevice) return;
    try {
      await api(`/api/commands/send`, {
        method: 'POST',
        body: JSON.stringify({ deviceId: selectedDevice.id, type: commandType })
      });
      alert(`Tactical directive [${commandType}] transmitted successfully.`);
    } catch (err) {
      alert("Directive transmission failed: " + err.message);
    }
  };

  const categories = ["sedan", "suv", "truck", "pickup", "van", "bus", "bike", "emergency", "security", "cargo", "drone"];
  const colors = ["cyan", "indigo", "purple", "emerald", "rose", "amber", "lime", "orange", "fuchsia", "sky"];

  const filteredDevices = devices.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.uniqueId?.includes(searchTerm)
  );

  return (
    <div className="devices-admin-page animate-fade-in">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Global Asset Registry</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Centralized oversight of all tactical hardware synchronized with the GeoSure network.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {['all', 'logistics', 'security', 'utility'].map((g) => (
                   <button 
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      style={{ 
                         padding: '6px 16px', 
                         borderRadius: '8px', 
                         fontSize: '0.7rem', 
                         fontWeight: 800, 
                         textTransform: 'uppercase',
                         background: activeGroup === g ? 'var(--primary)' : 'transparent',
                         color: activeGroup === g ? 'white' : 'var(--text-dim)',
                         border: 'none',
                         cursor: 'pointer'
                      }}
                   >
                      {g}
                   </button>
                ))}
             </div>
             <div className="input-group" style={{ width: '280px', margin: 0 }}>
                <Search size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Identify asset by IMEI or alias..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} 
                />
             </div>
             <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>Add Asset</button>
             <button className="btn glass-bright" onClick={() => document.getElementById('bulk-upload').click()}>Bulk Provisioning</button>
             <input 
                id="bulk-upload" 
                type="file" 
                accept=".csv" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    // Logic to parse CSV and call /api/devices in loop or bulk endpoint
                    alert(`Strategic manifest [${file.name}] intercepted. Commencing bulk ingestion... (Simulation active)`);
                }}
             />
             <button className="btn glass-bright" onClick={fetchDevices}>
                <RefreshCcw size={18} /> Resync Assets
             </button>
          </div>
        </header>

        {isAddModalOpen && (
            <div className="modal-overlay">
                <div className="card modal-content animate-slide-up" style={{ width: '450px' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Register New Tactical Asset</h2>
                    <form onSubmit={handleAddDevice}>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Asset Alias (Name)</label>
                            <input type="text" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} required />
                        </div>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Hardware ID (IMEI)</label>
                            <input type="text" value={newDevice.uniqueId} onChange={e => setNewDevice({...newDevice, uniqueId: e.target.value})} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="input-group-light" style={{ margin: 0 }}>
                                <label>Vehicle Category</label>
                                <select value={newDevice.category} onChange={e => setNewDevice({...newDevice, category: e.target.value})} 
                                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', padding: '0.5rem 0' }}>
                                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="input-group-light" style={{ margin: 0 }}>
                                <label>Asset Marker Color</label>
                                <select value={newDevice.color || "cyan"} onChange={e => setNewDevice({...newDevice, color: e.target.value})} 
                                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', padding: '0.5rem 0' }}>
                                    {colors.map(c => <option key={c} value={c} style={{ color: 'var(--primary)' }}>{c.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Commit to Registry</button>
                            <button type="button" className="btn glass-bright" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>Abort</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {isCommandModalOpen && selectedDevice && (
            <div className="modal-overlay">
                <div className="card modal-content animate-slide-up" style={{ width: '500px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                                <Terminal size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Tactical Command Center</h2>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Asset: {selectedDevice.name} ({selectedDevice.uniqueId})</p>
                            </div>
                        </div>
                        <button className="btn-icon" onClick={() => setIsCommandModalOpen(false)}><RefreshCcw size={18} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <button className="btn glass-bright" style={{ height: '100px', flexDirection: 'column', gap: '10px', color: 'var(--danger)', borderColor: 'rgba(255, 75, 108, 0.2)' }} onClick={() => handleSendCommand('engineStop')}>
                            <Power size={24} />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>ENGINE CUT</span>
                        </button>
                        <button className="btn glass-bright" style={{ height: '100px', flexDirection: 'column', gap: '10px', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }} onClick={() => handleSendCommand('engineResume')}>
                            <Zap size={24} />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>RESUME OPS</span>
                        </button>
                        <button className="btn glass-bright" style={{ height: '100px', flexDirection: 'column', gap: '10px', color: 'white' }} onClick={() => handleSendCommand('rebootDevice')}>
                            <RotateCcw size={24} />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>REBOOT NODE</span>
                        </button>
                        <button className="btn glass-bright" style={{ height: '100px', flexDirection: 'column', gap: '10px', color: 'var(--primary)' }} onClick={() => handleSendCommand('positionPeriodic')}>
                            <Activity size={24} />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>SET INTERVAL</span>
                        </button>
                    </div>

                    <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Shield size={14} color="var(--primary)" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Authorized Command Protocol</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>Direct hardware override requires high-level admin clearance. All directives are logged in the audit trail.</p>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', height: '52px', borderRadius: '16px' }} onClick={() => setIsCommandModalOpen(false)}>Terminate Session</button>
                </div>
            </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
               <RefreshCcw size={40} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
               <div style={{ fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Retrieving encrypted asset manifests...</div>
            </div>
          ) : (
            <table className="animate-fade-in">
              <thead>
                <tr>
                  <th>Tactical Signature</th>
                  <th>Hardware Identity</th>
                  <th>Vehicle Category</th>
                  <th>Assigned Operative</th>
                  <th>Connectivity</th>
                  <th>Strategic Reallocation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map(device => (
                  <tr key={device.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ 
                           width: '42px', height: '42px', borderRadius: '12px', 
                           background: device.status === 'online' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)', 
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           color: device.status === 'online' ? 'var(--primary)' : 'var(--text-dim)'
                         }}>
                            <Smartphone size={22} />
                         </div>
                         <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{device.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node #{String(device.id).substring(0, 6)}</div>
                         </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '6px', color: 'var(--primary)', fontSize: '0.9rem' }}>{device.uniqueId}</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                          value={device.category || 'sedan'} 
                          onChange={(e) => handleUpdateDevice({ ...device, category: e.target.value })}
                          style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', width: '100px'
                          }}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.substring(0,6).toUpperCase()}</option>
                          ))}
                        </select>
                        <select 
                          value={device.color || 'cyan'} 
                          onChange={(e) => handleUpdateDevice({ ...device, color: e.target.value })}
                          style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', width: '100px'
                          }}
                        >
                          {colors.map(col => (
                            <option key={col} value={col}>{col.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: device.userId ? 'var(--text-main)' : 'var(--text-dim)' }}>
                         <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {users.find(u => u.id === device.userId)?.name || (device.userId ? `Operative ${device.userId}` : "Unallocated")}
                         </span>
                      </div>
                    </td>
                    <td>
                      {device.status === 'online' ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Wifi size={14} /> Link Active
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <WifiOff size={14} /> Link Severed
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                         <select 
                           value={allocations[device.id] || ""}
                           style={{ 
                             background: 'rgba(255,255,255,0.03)', 
                             border: '1px solid rgba(255,255,255,0.1)', 
                             color: 'white', 
                             padding: '0.5rem', 
                             borderRadius: '10px',
                             fontSize: '0.8rem',
                             width: '130px',
                             outline: 'none'
                           }}
                           onChange={(e) => handleAllocChange(device.id, e.target.value)}
                         >
                            <option value="">Select Operative</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                         </select>
                         <button className="btn btn-primary" style={{ padding: '0.5rem 0.85rem', height: '38px', borderRadius: '10px', fontSize: '0.75rem' }} onClick={() => handleTransfer(device.id)}>
                            <ArrowRightLeft size={14} /> Reallocate
                         </button>
                      </div>
                    </td>
                     <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                           <button className="btn glass-bright" style={{ padding: '0.5rem', borderRadius: '10px' }} title="Tactical Commands" onClick={() => { setSelectedDevice(device); setIsCommandModalOpen(true); }}>
                              <Terminal size={18} color="var(--primary)" />
                           </button>
                           <button className="btn glass-bright" style={{ padding: '0.5rem', borderRadius: '10px' }}>
                              <Settings size={18} />
                           </button>
                        </div>
                     </td>
                  </tr>
                ))}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '10rem 5rem', color: 'var(--text-dim)' }}>
                       <Target size={60} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                       <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Assets Detected</h2>
                       <p>No hardware found matching the specified tactical signature in the global registry.</p>
                       <button className="btn btn-primary" style={{ margin: '2rem auto 0' }} onClick={() => setSearchTerm("")}>View All Assets</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}



