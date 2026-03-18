import { useState } from "react";
import { X, Cpu, Tag, Smartphone, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { addDevice } from "../services/deviceService";

export default function AddDeviceModal({ isOpen, onClose, onDeviceAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
    model: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const newDevice = await addDevice(formData);
      onDeviceAdded(newDevice);
      onClose();
      // Reset form
      setFormData({ name: "", uniqueId: "", model: "" });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Hardware link failed. Please verify the IMEI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ 
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="modal-card glass animate-slide-up" style={{ 
        width: '100%', maxWidth: '480px', background: 'rgba(30, 41, 59, 0.65)', 
        borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.1)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' 
      }}>
        <div className="modal-header" style={{ 
          padding: '2rem', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--primary)' }}>
                <ShieldCheck size={22} />
             </div>
             <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Link New Asset</h3>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ opacity: 0.6 }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>
          {error && (
            <div className="error-msg animate-fade-in" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', color: '#fb7185', padding: '14px', 
              borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', 
              fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' 
            }}>
              {error}
            </div>
          )}
          
          <div className="input-group-light">
            <label>Asset Identity Name</label>
            <span className="input-icon"><Tag size={18} /></span>
            <input 
              type="text" 
              placeholder="e.g. Tactical Unit 01" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
            />
          </div>

          <div className="input-group-light">
            <label>Hardware ID (IMEI)</label>
            <span className="input-icon"><Cpu size={18} /></span>
            <input 
              type="text" 
              placeholder="15-digit unique signature" 
              value={formData.uniqueId}
              onChange={(e) => setFormData({...formData, uniqueId: e.target.value})}
              required 
            />
          </div>

          <div className="input-group-light" style={{ marginBottom: '2rem' }}>
            <label>Hardware Specification</label>
            <span className="input-icon"><Smartphone size={18} /></span>
            <input 
              type="text" 
              placeholder="e.g. GPS Tracker TK-103" 
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
            <button type="button" className="btn glass-bright" onClick={onClose} disabled={loading} style={{ color: 'var(--text-dim)', borderRadius: '16px' }}>
              Decline
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ borderRadius: '16px' }}>
              {loading ? (
                <>Establishing Link...</>
              ) : (
                <>Authorize Data Handshake <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

