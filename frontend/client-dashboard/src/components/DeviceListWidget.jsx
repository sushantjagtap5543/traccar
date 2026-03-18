import { Search, Filter, Smartphone, ChevronRight } from "lucide-react";

export default function DeviceListWidget({ devices, onSelect, selectedId }) {
  return (
    <div className="floating-panel panel-left animate-slide-up">
      <div className="widget-card glass" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="search-bar glass-bright mb-4" style={{ borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} color="var(--text-dim)" />
          <input 
            type="text" 
            placeholder="Search devices..." 
            style={{ background: 'transparent', border: 'none', padding: '0.25rem', fontSize: '0.9rem' }}
          />
          <button className="btn-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
            <Filter size={14} />
          </button>
        </div>

        <div className="device-list">
          {devices.map((device) => (
            <div 
              key={device.id} 
              className={`device-item ${selectedId === device.id ? 'active' : ''}`}
              onClick={() => onSelect(device)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={`status-indicator ${device.online ? 'status-online' : 'status-offline'}`} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{device.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{device.uniqueId}</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-dim)" />
            </div>
          ))}
          {devices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
              <Smartphone size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p>No devices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
