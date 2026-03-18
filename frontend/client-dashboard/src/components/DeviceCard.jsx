import { ChevronRight, Battery, Wifi, MapPin, Activity, Navigation, Clock, Settings, Zap, Share2, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function DeviceCard({ device: initialDevice, viewMode = 'grid', onEdit, onShare }) {
  const [device, setDevice] = useState(initialDevice);
  
  useEffect(() => {
    setDevice(initialDevice);
  }, [initialDevice]);

  const isOnline = device.status === "online";
  const statusColor = isOnline ? "var(--success)" : "var(--text-dim)";
  
  const ignition = device.attributes?.ignition === true;
  const battery = device.attributes?.batteryLevel !== undefined ? `${device.attributes.batteryLevel}%` : "N/A";

  if (viewMode === 'list') {
    return (
      <div className="device-item glass mb-3" style={{ padding: '1.25rem 2rem', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
            <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{device.name}</h3>
                {!ignition && <span style={{ background: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>OFF</span>}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>IMEI: {device.uniqueId}</p>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', gap: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={16} color="var(--primary)" />
              <span style={{ textTransform: 'uppercase' }}>{device.category || "SEDAN"}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Zap size={16} color={ignition ? 'var(--amber)' : 'var(--text-dim)'} />
               <span style={{ color: ignition ? 'var(--amber)' : 'inherit' }}>{ignition ? 'Ignition On' : 'Ignition Off'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onShare(); }} title="Strategic Share"><Share2 size={18} /></button>
            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Tactical Settings"><Settings size={18} /></button>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Track Asset</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`device-card glass animate-slide-up ${!ignition ? 'ignition-alert-card' : ''}`} style={{ 
        borderRadius: '24px', 
        overflow: 'hidden',
        border: !ignition ? '2px solid var(--danger)' : '1px solid var(--border)',
        boxShadow: !ignition ? '0 0 20px rgba(244, 63, 94, 0.2)' : 'none'
    }}>
      {!ignition && (
        <div style={{ background: 'var(--danger)', color: 'white', padding: '6px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>
             <Zap size={12} weight="fill" fill="white" style={{ display: 'inline', marginRight: '5px' }} /> ASSET IMMOBILIZED (IGNITION OFF)
        </div>
      )}
      <div className="card-header" style={{ borderBottom: '1px solid var(--border)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={22} color={isOnline ? "var(--primary)" : "var(--text-dim)"} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{device.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`} />
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: statusColor, fontWeight: 700 }}>
                        {device.status || 'Offline'}
                    </span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-icon glass-bright" onClick={(e) => { e.stopPropagation(); onShare(); }} title="Strategic Share"><Share2 size={18} /></button>
                <button className="btn-icon glass-bright" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Tactical Settings"><Settings size={18} /></button>
            </div>
</div>
      </div>
      
      <div className="card-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-bright" style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
           <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>IDENTIFIER</span>
           <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{device.uniqueId}</span>
        </div>
        <div className="glass-bright" style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
           <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>TYPE</span>
           <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{device.category || 'SEDAN'}</span>
        </div>
        
        <div className="glass-bright" style={{ gridColumn: 'span 2', padding: '1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Battery size={18} color={parseInt(battery) < 20 ? 'var(--danger)' : 'var(--success)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{battery}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color={ignition ? 'var(--amber)' : 'var(--text-dim)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: ignition ? 'var(--amber)' : 'inherit' }}>{ignition ? 'ON' : 'OFF'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wifi size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>100%</span>
            </div>
        </div>
      </div>
 
      <div className="card-footer" style={{ padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <button className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>Live Tactical View</button>
      </div>
    </div>
  );
}

