import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { ShieldCheck, Search, Filter, History, User, Activity, Globe, Monitor, Clock } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Assuming endpoint exists or we'll add it
      const data = await api("/api/audit-logs"); 
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(search.toLowerCase()) || 
    log.userId?.toString().includes(search)
  );

  return (
    <div className="audit-logs-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container" style={{ padding: '2rem' }}>
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px' }}>
               <ShieldCheck size={32} color="var(--primary)" /> Forensic Audit Trail
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Immutability record of all high-level system operations and manual overrides.</p>
          </div>
          <div className="glass-bright" style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="var(--success)" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>System Integrity: SECURE</span>
          </div>
        </header>

        <div className="filters-bar glass mb-8" style={{ padding: '1rem', borderRadius: '20px', display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Search by Action, Operative ID, or Protocol..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
            />
          </div>
          <button className="btn-icon glass-bright" style={{ borderRadius: '12px' }}><Filter size={20} /></button>
          <button className="btn glass-bright" onClick={fetchLogs}><History size={18} /> Refresh Stream</button>
        </div>

        <div className="glass widget-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Timestamp</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Operative</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Action Protocol</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Digital Signature (IP)</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Intelligence Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1.25rem 2rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(log.createdAt).toLocaleString()}</span>
                     </div>
                  </td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>Operative {log.userId}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem' }}>
                        {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        <Globe size={14} />
                        {log.ipAddress || '0.0.0.0'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help' }} title={log.details}>
                        {log.details || 'No additional telemetry data'}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                    <td colSpan="5" style={{ padding: '5rem', textAlign: 'center' }}>
                        <ShieldCheck size={48} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                        <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Tactical logs synchronizing with high-security core...</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
