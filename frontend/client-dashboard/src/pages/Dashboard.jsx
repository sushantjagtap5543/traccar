import { useEffect, useState, useCallback } from "react";
import MapView from "../components/MapView";
import { getPositions, getDevices } from "../services/deviceService";
import socketService from "../services/socketService";
import Loader from "../components/Loader";
import { Search, Map as MapIcon, RefreshCcw, Share2, UserPlus, Link, ShieldAlert, CheckCircle, ExternalLink, HardDrive, Terminal, Power, Zap, RotateCcw, Activity } from "lucide-react";
import { sendCommand } from "../services/deviceService";

export default function Dashboard() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [positions, setPositions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ 
    active: 0, 
    offline: 0, 
    total: 0,
    dailyDistance: 0,
    overallDistance: 0,
    dailyTrips: 0,
    overallTrips: 0
  });

  const updateStats = useCallback((posList, devList) => {
    const activeCount = posList.filter(p => (new Date() - new Date(p.fixTime || p.serverTime)) < 600000).length;
    setStats({
      active: activeCount,
      offline: devList.length - activeCount,
      total: devList.length
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [posData, devData] = await Promise.all([
        getPositions(),
        getDevices()
      ]);
      
      const posArr = Array.isArray(posData) ? posData : [];
      const devArr = Array.isArray(devData) ? devData : [];
      
      setPositions(posArr);
      setDevices(devArr);
      updateStats(posArr, devArr);

      // Fetch extended client stats from new endpoint
      try {
        const { data: user } = await import("../services/api").then(m => m.default.get("/session/user"));
        if (user && user.id) {
          const { data: clientStats } = await import("../services/api").then(m => m.default.get(`/admin/devices/client/${user.id}`));
          setStats(prev => ({
            ...prev,
            dailyDistance: clientStats.dailyDistance,
            overallDistance: clientStats.overallDistance,
            dailyTrips: clientStats.dailyTrips,
            overallTrips: clientStats.overallTrips
          }));
        }
      } catch (e) { console.error("Extended stats load failed", e); }

    } catch (err) {
      console.error("Dashboard data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [updateStats]);

  useEffect(() => {
    fetchData();

    const handlePosUpdate = (newPos) => {
      setPositions(prev => {
        const index = prev.findIndex(p => p.deviceId === newPos.deviceId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newPos };
          return updated;
        }
        return [...prev, newPos];
      });
    };

    socketService.on("position_update", handlePosUpdate);
    return () => socketService.off("position_update");
  }, [fetchData]);

  const filteredDevices = devices.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.uniqueId?.includes(searchTerm)
  );

  if (loading) return <Loader />;

  const handleShare = (device) => {
    const link = `https://geosure-track.live/v3/share/${device.uniqueId}`;
    setShareLink(link);
    setShowShareModal(true);
    navigator.clipboard.writeText(link);
  };

  const handleSendCommand = async (type) => {
    if (!selectedDevice) return;
    try {
        await sendCommand(selectedDevice.id, type);
        alert(`Strategic Directive [${type}] executed on ${selectedDevice.name}. Protocol confirmed.`);
    } catch (err) {
        alert("Command transmission failed: " + err.message);
    }
  };

  return (
    <div className="dashboard-page">
      {showShareModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="card modal-content animate-slide-up" style={{ width: '400px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
               <CheckCircle size={32} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 900 }}>Live Portal Generated</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>A strategic encrypted tracking port has been activated. The link is copied to your clipboard.</p>
            <div className="glass-bright" style={{ padding: '12px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
              {shareLink}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowShareModal(false)}>Close Intelligence Portal</button>
          </div>
        </div>
      )}

      {isCommandModalOpen && selectedDevice && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
            <div className="card modal-content animate-slide-up" style={{ width: '450px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Remote Command Center</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>Asset: {selectedDevice.name}</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <button className="btn glass-bright" style={{ height: '90px', flexDirection: 'column', gap: '10px', color: 'var(--danger)' }} onClick={() => handleSendCommand('engineStop')}>
                        <Power size={20} />
                        <span style={{ fontWeight: 800, fontSize: '0.7rem' }}>ENGINE STOP</span>
                    </button>
                    <button className="btn glass-bright" style={{ height: '90px', flexDirection: 'column', gap: '10px', color: 'var(--success)' }} onClick={() => handleSendCommand('engineResume')}>
                        <Zap size={20} />
                        <span style={{ fontWeight: 800, fontSize: '0.7rem' }}>ENGINE START</span>
                    </button>
                    <button className="btn glass-bright" style={{ height: '90px', flexDirection: 'column', gap: '10px', color: 'white' }} onClick={() => handleSendCommand('rebootDevice')}>
                        <RotateCcw size={20} />
                        <span style={{ fontWeight: 800, fontSize: '0.7rem' }}>REBOOT</span>
                    </button>
                    <button className="btn glass-bright" style={{ height: '90px', flexDirection: 'column', gap: '10px', color: 'var(--primary)' }} onClick={() => handleSendCommand('positionPeriodic')}>
                        <Activity size={20} />
                        <span style={{ fontWeight: 800, fontSize: '0.7rem' }}>FOCUS MODE</span>
                    </button>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0 }}>Directive is transmitted via encrypted satellite link. Results depend on device signal strength.</p>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setIsCommandModalOpen(false)}>Close Session</button>
            </div>
        </div>
      )}
      <div className="map-container">
        <MapView 
          positions={positions} 
          selectedDevice={selectedDevice ? positions.find(p => p.deviceId === selectedDevice.id) || selectedDevice : null} 
        />
      </div>

      <div className="floating-overlay">
        <div className="panel-left-fixed">
          {/* Header & Search */}
          <div className="glass widget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Fleet Monitor</h3>
              <button className="btn-icon" onClick={fetchData} title="Refresh Data">
                <RefreshCcw size={18} />
              </button>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <Search size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Search device, IMEI..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="glass widget-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.active}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online</div>
            </div>
            <div className="glass widget-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.offline}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline</div>
            </div>
            <div className="glass widget-card" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.total}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
            </div>
          </div>

          {/* New Tactical Dashboard Stats */}
          <div className="glass widget-card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(255,255,255,0.02) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Daily Dist.</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{stats.dailyDistance} <small style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>KM</small></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Overall</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>{stats.overallDistance?.toLocaleString()} <small style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>KM</small></div>
              </div>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.75rem 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Trips Today</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{stats.dailyTrips}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>Total Trips</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-purple)' }}>{stats.overallTrips}</div>
              </div>
            </div>
          </div>

          {/* Device List */}
          <div className="glass widget-card device-list" style={{ overflowY: 'auto' }}>
            {filteredDevices.length > 0 ? (
              filteredDevices.map(device => {
                const pos = positions.find(p => p.deviceId === device.id);
                const isOnline = pos && (new Date() - new Date(pos.fixTime || pos.serverTime)) < 600000;
                const isTestDevice = device.uniqueId === '869727079043558';
                
                return (
                  <div 
                    key={device.id} 
                    className={`device-item ${selectedDevice?.id === device.id ? 'active' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                    style={{ 
                      flexDirection: 'column', height: 'auto', gap: '8px', 
                      ...(isTestDevice ? { borderLeft: '3px solid var(--accent-purple)', background: 'rgba(129, 140, 248, 0.05)' } : {}),
                      ...(!pos?.attributes?.ignition && pos ? { borderLeft: '4px solid var(--danger)', background: 'rgba(244, 63, 94, 0.05)' } : {})
                    }}
                  >
                    {!pos?.attributes?.ignition && pos && (
                        <div style={{ background: 'var(--danger)', color: 'white', padding: '2px 10px', fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px', marginBottom: '4px', width: 'fit-content' }}>
                            <Zap size={10} style={{ display: 'inline', marginRight: '4px' }} /> IGNITION OFF
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ 
                            width: '42px', height: '42px', borderRadius: '12px', 
                            background: isTestDevice ? 'rgba(129, 140, 248, 0.12)' : (isOnline ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.05)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid',
                            borderColor: isTestDevice ? 'rgba(129, 140, 248, 0.3)' : (isOnline ? 'rgba(6, 182, 212, 0.2)' : 'transparent')
                          }}>
                            <MapIcon size={20} color={isTestDevice ? 'var(--accent-purple)' : (isOnline ? 'var(--primary)' : 'var(--text-dim)')} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{device.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{device.uniqueId}</span>
                          </div>
                        </div>
                        {pos && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isOnline ? 'var(--primary)' : 'var(--text-main)' }}>
                              {pos.speed?.toFixed(0) || 0}
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: '2px' }}>km/h</span>
                            </div>
                          </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                            <UserPlus size={14} color="var(--primary)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-dim)' }}>
                                {device.driverName || "Assign Operative"}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-icon mini-tactical" onClick={(e) => { e.stopPropagation(); handleShare(device); }} title="Share Live Port">
                                <Share2 size={12} />
                            </button>
                            <button className="btn-icon mini-tactical" onClick={(e) => { e.stopPropagation(); setIsCommandModalOpen(true); setSelectedDevice(device); }} title="Tactical Commands">
                                <Terminal size={12} />
                            </button>
                            <button className="btn-icon mini-tactical" onClick={(e) => { e.stopPropagation(); window.location.href=`/drivers?assign=${device.id}`; }} title="Operative Config">
                                <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                <Search size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>No tracking units found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
