import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { MapPin, Layout, ShieldAlert, Plus, Trash2, Edit2, Map as MapIcon, Globe, RefreshCcw, Search, MoreVertical } from "lucide-react";

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api("/api/geofences");
      setGeofences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch geofences", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this geozonal tactical boundary? Asset entry/exit alerts will be terminated.")) return;
    try {
      await api(`/api/geofences/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert("Failed to delete boundary: " + err.message);
    }
  };

  return (
    <div className="geofences-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Tactical Geozones</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Global perimeter management and asset entry/exit governance.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn glass-bright" onClick={fetchData} disabled={loading}>
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> Sync Zones
            </button>
            <button className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: '14px' }}>
                <Plus size={20} /> Deploy New Perimeter
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layout size={18} color="var(--primary)" /> Zone Controls
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group-light" style={{ margin: 0 }}>
                         <label>Global Filter</label>
                         <span className="input-icon"><Search size={16} /></span>
                         <input placeholder="Search zones..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid var(--primary-glow)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>GEOZONE STATS</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Total Active Perimeters</span>
                        <span style={{ fontWeight: 800, color: 'white' }}>{geofences.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>Critical Breach Areas</span>
                        <span style={{ fontWeight: 800, color: 'var(--danger)' }}>3</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', alignContent: 'start' }}>
                {geofences.length > 0 ? (
                    geofences.map((zone) => (
                        <div key={zone.id} className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.3)', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                                        <MapPin size={22} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{zone.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{zone.areaType || 'POLYGON'} SHAPE</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-icon" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                                    <button className="btn-icon" style={{ padding: '0.5rem', color: 'var(--danger)' }} onClick={() => handleDelete(zone.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, display: 'block' }}>RADIUS / AREA</span>
                                    <span style={{ fontWeight: 700 }}>{zone.radius ? `${zone.radius}m` : 'Defined Area'}</span>
                                </div>
                                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, display: 'block' }}>VIOLATIONS (24H)</span>
                                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>12 Alert Triggers</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Globe size={14} color="var(--primary)" />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Global Persistence Active</span>
                                </div>
                                <button className="btn glass-bright" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Apply To All Assets</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card lg:col-span-2" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(6, 182, 212, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
                            <MapIcon size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Tactical Boundaries Defined</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Create global or asset-specific geozones to automate fleet monitoring and breach alerts.</p>
                        <button className="btn btn-primary" style={{ marginTop: '2rem', padding: '0.85rem 2rem', borderRadius: '16px' }}>
                             Deploy First Boundary
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
