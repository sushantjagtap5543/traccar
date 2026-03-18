import { useState } from "react";
import { MapContainer, TileLayer, Circle, Polygon, FeatureGroup } from "react-leaflet";
import { Plus, Search, ShieldCheck, MapPin, Edit3, Trash2, ChevronRight, Layers, Maximize2, Settings } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function Geofencing() {
  const [loading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [fences] = useState([
    { id: 1, name: "Strategic Warehouse Hub", type: "Circular", radius: 500, center: [18.5204, 73.8567], status: "Active" },
    { id: 2, name: "Restricted Ops Zone", type: "Polygon", coords: [[18.525, 73.86], [18.53, 73.865], [18.525, 73.87]], status: "Active" },
    { id: 3, name: "Primary Trade Corridor", type: "Linear", status: "Inactive" },
  ]);

  const filteredFences = fences.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="geofencing-page animate-fade-in" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-px' }}>Spatial Intelligence Console</h2>
          <p style={{ color: 'var(--text-muted)' }}>Configure secure tactical perimeters and perimeter-violation triggers.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn glass-bright">
                <Maximize2 size={18} /> Global View
            </button>
            <button className="btn-primary" style={{ padding: '0.9rem 1.5rem', borderRadius: '16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={20} /> Initialize Perimeter
            </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left: Tactical Map Canvas */}
        <div className="glass widget-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', border: '1px solid var(--primary-glow)', borderRadius: '24px' }}>
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="glass-bright" style={{ padding: '8px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px', backdropFilter: 'blur(20px)' }}>
                    <button className="btn-icon active" title="Polygon Drawing"><Edit3 size={20} /></button>
                    <button className="btn-icon" title="Circular Radius"><MapPin size={20} /></button>
                    <button className="btn-icon" title="Linear Corridor"><ChevronRight size={20} /></button>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} title="Clear Selection"><Trash2 size={20} /></button>
                </div>
            </div>

            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 1000 }}>
                 <div className="glass-bright" style={{ padding: '10px 20px', borderRadius: '14px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--primary-glow)' }}>
                    <div className="radar-ping" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    TACTICAL SCAN: ACTIVE
                </div>
            </div>

            <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ width: '100%', height: '100%', background: '#0f172a' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <FeatureGroup>
                {fences.filter(f => f.status === 'Active').map(fence => (
                  fence.type === 'Circular' ? (
                    <Circle 
                        key={fence.id}
                        center={fence.center} 
                        radius={fence.radius} 
                        pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.15, weight: 2, dashArray: '8, 8' }} 
                    />
                  ) : (
                    <Polygon 
                        key={fence.id}
                        positions={fence.coords} 
                        pathOptions={{ color: 'var(--accent-purple)', fillColor: 'var(--accent-purple)', fillOpacity: 0.15, weight: 2, dashArray: '8, 8' }} 
                    />
                  )
                ))}
              </FeatureGroup>
            </MapContainer>
        </div>

        {/* Right: Perimeter Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <div className="filters-bar glass" style={{ padding: '1rem', borderRadius: '20px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Search size={20} color="var(--text-dim)" />
                <input 
                    type="text" 
                    placeholder="Search tactical zones..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredFences.map(fence => (
                  <div key={fence.id} className="glass widget-card hover-glow" style={{ padding: '1.5rem', borderRadius: '22px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: fence.status === 'Active' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: fence.status === 'Active' ? 'var(--primary)' : 'var(--text-dim)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{fence.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                     <span className={`badge ${fence.status === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{fence.status}</span>
                                     <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{fence.type} • {fence.radius ? `${fence.radius}m` : 'Multi-point'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-icon glass-bright" style={{ width: '38px', height: '38px', borderRadius: '10px' }}><Settings size={16} /></button>
                            <button className="btn-icon glass-bright" style={{ width: '38px', height: '38px', borderRadius: '10px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
        </div>
      </div>

      <style jsx>{`
        .hover-glow:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
            box-shadow: 0 10px 30px -10px var(--primary-glow);
        }
        .radar-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
        .btn-icon.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 0 15px var(--primary-glow);
        }
      `}</style>
    </div>
  );
}
