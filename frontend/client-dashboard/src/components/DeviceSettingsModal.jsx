import { useState, useEffect } from "react";
import { X, Save, Smartphone, Gauge, Layout, Info } from "lucide-react";
import api from "../services/api";

export default function DeviceSettingsModal({ isOpen, onClose, device, onUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "sedan",
    color: "cyan",
    speedLimit: 80
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || "",
        category: device.category || "sedan",
        color: device.color || "cyan",
        speedLimit: device.attributes?.speedLimit || 80
      });
    }
  }, [device]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedDevice = {
        ...device,
        name: formData.name,
        category: formData.category,
        color: formData.color,
        attributes: {
          ...device.attributes,
          speedLimit: formData.speedLimit
        }
      };
      await api.put(`/devices/${device.id}`, updatedDevice);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to update asset profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: 'sedan', label: 'Sedan / Car', icon: '🚗' },
    { id: 'truck', label: 'Heavy Truck', icon: '🚛' },
    { id: 'rickshaw', label: 'Auto Rickshaw', icon: '🛺' },
    { id: 'bike', label: 'Motorbike', icon: '🏍️' },
    { id: 'bus', label: 'Bus / Coach', icon: '🚌' },
    { id: 'pickup', label: 'Pickup Van', icon: '🚚' },
    { id: 'tractor', label: 'Tractor / JCB', icon: '🚜' }
  ];

  return (
    <div className="modal-overlay">
      <div className="glass modal-content animate-scale-in" style={{ width: '500px', padding: '2rem', borderRadius: '32px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Asset Calibration</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Update tactical profile for {device?.uniqueId}</p>
          </div>
          <button className="btn-icon glass-bright" onClick={onClose}><X size={20} /></button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>DISPLAY NAME</label>
            <div className="input-group">
                <Layout size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Primary Logistic Node A"
                />
            </div>
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>TACTICAL CATEGORY</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {categories.map(cat => (
                   <div 
                    key={cat.id}
                    onClick={() => setFormData({...formData, category: cat.id})}
                    style={{ 
                        padding: '12px', 
                        borderRadius: '16px', 
                        background: formData.category === cat.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: formData.category === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                   >
                     <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                     <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.label}</span>
                   </div>
                ))}
            </div>
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}>TACTICAL MARKER COLOR</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['cyan', 'indigo', 'purple', 'emerald', 'rose', 'amber', 'lime', 'orange', 'fuchsia', 'sky'].map(c => (
                   <div 
                    key={c}
                    onClick={() => setFormData({...formData, color: c})}
                    style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        backgroundColor: c === 'cyan' ? '#06b6d4' : (c === 'emerald' ? '#10b981' : (c === 'rose' ? '#f43f5e' : c)), 
                        border: formData.color === c ? '3px solid white' : 'none',
                        cursor: 'pointer',
                        boxShadow: formData.color === c ? `0 0 10px ${c}` : 'none',
                        transition: 'all 0.2s'
                    }}
                   />
                ))}
            </div>
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>SPEED LIMIT (KM/H)</label>
            <div className="input-group">
                <Gauge size={18} className="input-icon" />
                <input 
                  type="number" 
                  value={formData.speedLimit} 
                  onChange={(e) => setFormData({...formData, speedLimit: parseInt(e.target.value)})}
                />
            </div>
          </div>
        </div>

        <footer style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
           <button className="btn glass-bright" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
           <button className="btn-primary" style={{ flex: 1.5 }} onClick={handleSave} disabled={saving}>
             <Save size={18} /> {saving ? "Synchronizing..." : "Update Asset"}
           </button>
        </footer>
      </div>
    </div>
  );
}
