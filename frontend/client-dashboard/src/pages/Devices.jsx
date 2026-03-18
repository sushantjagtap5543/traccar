import { useEffect, useState } from "react";
import { getDevices } from "../services/deviceService";
import DeviceCard from "../components/DeviceCard";
import AddDeviceModal from "../components/AddDeviceModal";
import DeviceSettingsModal from "../components/DeviceSettingsModal";
import Loader from "../components/Loader";
import ShareModal from "../components/ShareModal";
import { Plus, Search, Filter, Grid, List as ListIcon, Smartphone, TrendingUp } from "lucide-react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedDeviceForShare, setSelectedDeviceForShare] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch devices", err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const openSettings = (device) => {
    setSelectedDeviceForSettings(device);
    setIsSettingsModalOpen(true);
  };

  const openShare = (device) => {
    setSelectedDeviceForShare(device);
    setIsShareModalOpen(true);
  };

  const filteredDevices = devices.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.uniqueId?.includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="devices-page animate-slide-up" style={{ padding: '2rem' }}>
      <header className="page-header mb-8">
        <div className="header-info">
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Fleet Registry</h2>
          <p style={{ color: 'var(--text-muted)' }}>Found {filteredDevices.length} tactical units in your fleet</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="glass-bright" style={{ display: 'flex', borderRadius: '12px', padding: '4px' }}>
              <button 
                onClick={() => setViewMode("grid")}
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`} 
                style={{ width: '36px', height: '36px', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'var(--bg-deep)' : 'var(--text-main)' }}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                style={{ width: '36px', height: '36px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'var(--bg-deep)' : 'var(--text-main)' }}
              >
                <ListIcon size={18} />
              </button>
           </div>
            <button className="btn glass-bright" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> Bulk Manifest
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
             <Plus size={20} /> Register New Asset
           </button>
         </div>
       </header>

      <div className="filters-bar glass mb-8" style={{ padding: '0.75rem 1rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input 
            type="text" 
            placeholder="Search by name, IMEI or model..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-icon"><Filter size={20} /></button>
      </div>

      {filteredDevices.length > 0 ? (
        <div className={viewMode === 'grid' ? "devices-grid" : "devices-list-view"}>
          {filteredDevices.map(device => (
            <DeviceCard 
                key={device.id} 
                device={device} 
                viewMode={viewMode} 
                onEdit={() => openSettings(device)} 
                onShare={() => openShare(device)}
            />
          ))}
        </div>
      ) : (
        <div className="glass widget-card mt-8" style={{ textAlign: 'center', padding: '5rem', borderRadius: '24px' }}>
          <Smartphone size={60} style={{ opacity: 0.1, margin: '0 auto 2rem' }} />
          <h3>No Devices Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Start by adding your first tracking device to the platform.</p>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => setIsModalOpen(true)}>
            Register First Device
          </button>
        </div>
      )}

      <AddDeviceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDeviceAdded={fetchDevices}
      />

      <DeviceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        device={selectedDeviceForSettings}
        onUpdate={fetchDevices}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        deviceId={selectedDeviceForShare?.id}
      />
    </div>
  );
}

