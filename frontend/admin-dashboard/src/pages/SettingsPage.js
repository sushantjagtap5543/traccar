import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Settings, Save, Smartphone, Globe, Shield, CreditCard, MessageSquare, RefreshCcw } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api("/api/settings");
      setSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key, val, cat) => {
    try {
      await api("/api/settings", {
        method: 'POST',
        body: JSON.stringify({ key, value: val, category: cat })
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const categories = [
    { id: 'branding', title: 'Tactical Branding', icon: <Globe size={20} /> },
    { id: 'api', title: 'Intelligence APIs', icon: <CreditCard size={20} /> },
    { id: 'tactical', title: 'Fleet Constraints', icon: <Shield size={20} /> },
    { id: 'support', title: 'Human Resilience', icon: <MessageSquare size={20} /> },
  ];

  if (loading) return <div className="p-10 text-center animate-pulse">Decrypting global configuration...</div>;

  return (
    <div className="settings-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Global Core Settings</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Sovereign control over platform identity, telemetry limits, and strategic gateways.</p>
          </div>
          {success && <div className="badge badge-success animate-bounce">System Synchronized!</div>}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="card" style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid transparent', hover: { borderLeft: '4px solid var(--primary)' } }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ color: 'var(--primary)' }}>{cat.icon}</div>
                            <span style={{ fontWeight: 800 }}>{cat.title}</span>
                        </div>
                    </div>
                ))}
                
                <div className="card" style={{ marginTop: '2rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)' }}>
                    <h4 style={{ color: 'var(--danger)', fontWeight: 800, marginBottom: '0.5rem' }}>Tactical Reset</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Restore all system parameters to manufacturing defaults. This action is irreversible.</p>
                    <button className="btn btn-outline-danger" style={{ width: '100%', marginTop: '1rem' }}>Factory Purge</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="card">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                             {cat.icon} {cat.title}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {settings.filter(s => s.category === cat.id).map(setting => (
                                <div key={setting.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>{setting.key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        defaultValue={setting.value} 
                                        onBlur={(e) => handleUpdateSetting(setting.key, e.target.value, cat.id)}
                                        style={{ margin: 0 }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn-icon glass-bright" onClick={() => handleUpdateSetting(setting.key, setting.value, cat.id)}>
                                            <Save size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {settings.filter(s => s.category === cat.id).length === 0 && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>No parameters detected in this sector.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
