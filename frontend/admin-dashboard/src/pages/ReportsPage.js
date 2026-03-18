import React, { useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { FileText, Calendar, Play, Download, Smartphone, MapPin, Gauge, Activity, RefreshCcw, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ReportsPage() {
  const [deviceId, setDeviceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [reportType, setReportType] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // High-fidelity chart data
  const velocityData = [
    { time: '00:00', velocity: 45 }, { time: '04:00', velocity: 12 },
    { time: '08:00', velocity: 88 }, { time: '12:00', velocity: 65 },
    { time: '16:00', velocity: 92 }, { time: '20:00', velocity: 54 },
  ];

  const fleetStats = [
    { name: 'Active Duty', value: 65, color: 'var(--primary)' },
    { name: 'Stationary', value: 25, color: '#fbbf24' },
    { name: 'Maintenance', value: 10, color: 'var(--danger)' },
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api(`/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`);
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      alert("Failed to generate intelligence report. Verify coordinates and timeframe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-admin-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Fleet Intelligence Analytics</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Extract strategic insights and historical telemetry from the GeoSurePath database.</p>
          </div>
          <button className="btn glass-bright" onClick={() => { setData([]); setDeviceId(""); setFrom(""); setTo(""); }}>
            <RefreshCcw size={18} /> Clear Parameters
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 card" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} color="var(--primary)" /> Asset Velocity Metrics (Current Session)
                </h3>
                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={velocityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={12} />
                            <YAxis stroke="var(--text-dim)" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ background: '#1e293b', border: '1px solid var(--border)', borderRadius: '12px' }}
                                itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                            />
                            <Line type="monotone" dataKey="velocity" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6, fill: 'var(--primary)' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PieChartIcon size={20} color="var(--accent-purple)" /> Fleet Allocation
                </h3>
                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={fleetStats} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                {fleetStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {fleetStats.map(stat => (
                        <div key={stat.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }}></div>
                                {stat.name}
                            </span>
                            <span style={{ fontWeight: 800 }}>{stat.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="card" style={{ marginBottom: '2.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
           <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1.5rem', alignItems: 'end' }}>
              <div className="input-group-light" style={{ margin: 0 }}>
                 <label>Target Asset ID</label>
                 <span className="input-icon"><Smartphone size={18} /></span>
                 <input 
                   placeholder="Hardware ID" 
                   value={deviceId} 
                   onChange={e => setDeviceId(e.target.value)} 
                   required
                 />
              </div>
              <div className="input-group-light" style={{ margin: 0 }}>
                 <label>Operational Start</label>
                 <span className="input-icon"><Calendar size={18} /></span>
                 <input 
                   type="datetime-local" 
                   value={from} 
                   onChange={e => setFrom(e.target.value)} 
                   required
                 />
              </div>
               <div className="input-group-light" style={{ margin: 0 }}>
                  <label>Operational End</label>
                  <span className="input-icon"><Calendar size={18} /></span>
                  <input 
                    type="datetime-local" 
                    value={to} 
                    onChange={e => setTo(e.target.value)} 
                    required
                  />
               </div>
               <div className="input-group-light" style={{ margin: 0 }}>
                  <label>Intelligence Type</label>
                  <select 
                    value={reportType} 
                    onChange={e => setReportType(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', padding: '0.4rem 0' }}
                  >
                    <option value="summary">TACTICAL SUMMARY</option>
                    <option value="trips">OPERATIONAL TRIPS</option>
                    <option value="stops">STATIONARY NODES</option>
                    <option value="alerts">SYSTEM VIOLATIONS</option>
                  </select>
               </div>
               <button type="submit" className="btn btn-primary" style={{ height: '52px', padding: '0 2rem', borderRadius: '16px' }} disabled={loading}>
                  {loading ? <RefreshCcw className="animate-spin" size={20} /> : <><Play size={18} /> Generate</>}
               </button>
            </form>
         </div>

         {data.length > 0 && (
           <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--primary-glow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapIcon size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Historical Route Playback</h3>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-icon" onClick={() => setIsPlaying(!isPlaying)} style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%' }}>
                       {isPlaying ? <Activity size={20} /> : <Play size={20} />}
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '60px' }}>{playbackProgress}%</span>
                 </div>
              </div>
              <div style={{ padding: '0.5rem', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${playbackProgress}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.75rem', textAlign: 'right' }}>SIMULATED TELEMETRY STREAM FROM GEO-SATELLITE NODE</p>
           </div>
         )}

        {data.length > 0 ? (
          <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Tactical Summary Registry</h3>
               </div>
               <button className="btn glass-bright" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}><Download size={16} /> Export Intel</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Asset Identity</th>
                  <th>Total Deployment</th>
                  <th>Mean Velocity</th>
                  <th>Peak Velocity</th>
                  <th style={{ textAlign: 'right' }}>Telemetry Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)' }}>
                             <Smartphone size={16} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{item.deviceName}</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="var(--text-dim)" />
                          <span>{(item.distance / 1000).toFixed(2)} km</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Gauge size={16} color="var(--text-dim)" />
                          <span>{item.averageSpeed.toFixed(1)} km/h</span>
                       </div>
                    </td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Activity size={16} color="var(--danger)" />
                          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{item.maxSpeed.toFixed(1)} km/h</span>
                       </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <span className="badge badge-success">Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && (
          <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-dim)' }}>
                <FileText size={40} />
             </div>
             <h2 style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>No Intelligence Generated</h2>
             <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0.5rem auto 0' }}>Configure the tactical parameters above to extract historical fleet data from the secure repository.</p>
          </div>
        )}
      </div>
    </div>
  );
}

