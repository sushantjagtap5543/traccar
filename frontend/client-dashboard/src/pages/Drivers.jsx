import { useState, useEffect } from "react";
import { UserCheck, Phone, FileText, Plus, Search, Trash2, Edit3, ShieldAlert, CheckCircle } from "lucide-react";
import { api } from "../api/client"; 

export default function Drivers() {
  const [drivers, setDrivers] = useState([
    { id: '1', name: "Alex Rover", phone: "+91 98765 43210", licenseNumber: "DL-2024-X45", status: 'active', notes: "Top rated responder" },
    { id: '2', name: "Samantha Fleet", phone: "+91 87654 32109", licenseNumber: "DL-2023-F12", status: 'on_trip', notes: "Strategic asset coordinator" }
  ]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="drivers-page animate-fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Human Intelligence Registry</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and audit the roster of tactical vehicle operatives.</p>
        </div>
        <button className="btn-primary" style={{ padding: '0.9rem 1.5rem', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus size={20} /> Register New Operative
        </button>
      </header>

      <div className="glass" style={{ padding: '1rem', borderRadius: '20px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-dim)" />
          <input 
              type="text" 
              placeholder="Identify operative by name or license..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
          />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
         {filtered.map(driver => (
           <div key={driver.id} className="card hover-glow" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                 <div style={{ 
                    width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary) 0%, #0891b2 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px -4px var(--primary-glow)'
                 }}>
                    <UserCheck size={28} />
                 </div>
                 <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{driver.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                         <span className={`badge ${driver.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{driver.status.toUpperCase()}</span>
                    </div>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                      <Phone size={14} color="var(--primary)" />
                      <span style={{ color: 'var(--text-main)' }}>{driver.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                      <FileText size={14} color="var(--accent-purple)" />
                      <span style={{ color: 'var(--text-main)' }}>{driver.licenseNumber}</span>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn glass-bright" style={{ flex: 1, height: '42px', fontSize: '0.85rem' }}><Edit3 size={16} /> Update</button>
                  <button className="btn glass-bright" style={{ flex: 1, height: '42px', fontSize: '0.85rem', color: 'var(--danger)' }}><Trash2 size={16} /> Purge</button>
              </div>
           </div>
         ))}
      </div>

      <style>{`
        .hover-glow:hover { transform: translateY(-5px); border-color: var(--primary); }
      `}</style>
    </div>
  );
}
