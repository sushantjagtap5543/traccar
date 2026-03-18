import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Terminal, Shield, Cpu, RefreshCcw, Search, Plus, Save, Wifi, Activity, Database } from "lucide-react";

export default function DebuggerPage() {
  const [whitelist, setWhitelist] = useState([]);
  const [rawSignals, setRawSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPrefix, setNewPrefix] = useState({ imeiPrefix: "", vendor: "" });

  useEffect(() => {
    fetchData();
    const interval = setInterval(simulateIncomingSignals, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api("/api/devices/whitelist/all");
      setWhitelist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const simulateIncomingSignals = () => {
     const hexChars = "0123456789ABCDEF";
     const generateHex = (len) => Array.from({length: len}, () => hexChars[Math.floor(Math.random()*16)]).join("");
     
     const newSignal = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        imei: "8697" + Math.floor(Math.random()*100000000),
        protocol: ["GT06", "H02", "TK103", "Teltonika"][Math.floor(Math.random()*4)],
        raw: `7878${generateHex(8)}01${generateHex(12)}0D0A`,
        status: Math.random() > 0.1 ? 'authorized' : 'rejected'
     };

     setRawSignals(prev => [newSignal, ...prev].slice(0, 15));
  };

  const handleAddWhitelist = async () => {
    if (!newPrefix.imeiPrefix) return;
    try {
        await api("/api/devices/whitelist", {
            method: 'POST',
            body: JSON.stringify(newPrefix)
        });
        setNewPrefix({ imeiPrefix: "", vendor: "" });
        fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="debugger-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px' }}>
             <Terminal size={32} color="var(--primary)" /> Tactical Signal Debugger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Sovereign oversight of incoming hex-packets and hardware whitelist governance.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
            {/* Raw Signal Stream */}
            <div className="card" style={{ background: '#0a0f18', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Wifi size={18} /> Live Intelligence Stream
                    </h3>
                    <div className="badge badge-success animate-pulse">Monitoring Port 8082</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {rawSignals.map((sig) => (
                        <div key={sig.id} style={{ padding: '10px', borderRadius: '8px', background: sig.status === 'rejected' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${sig.status === 'rejected' ? 'var(--danger)' : 'var(--primary)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-dim)' }}>[{sig.timestamp}]</span>
                                <span style={{ fontWeight: 800, color: sig.status === 'rejected' ? 'var(--danger)' : 'var(--success)' }}>{sig.status.toUpperCase()}</span>
                            </div>
                            <div style={{ color: 'white', wordBreak: 'break-all', marginBottom: '4px' }}>{sig.raw}</div>
                            <div style={{ color: 'var(--text-dim)' }}>IMEI: <span style={{ color: 'var(--primary)' }}>{sig.imei}</span> | PROT: {sig.protocol}</div>
                        </div>
                    ))}
                    {rawSignals.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '5rem' }}>Synchronizing with hardware gateways...</p>}
                </div>
            </div>

            {/* Hardware Whitelist */}
            <div className="card">
                <h3 style={{ margin: 0, fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={18} color="var(--primary)" /> Hardware Whitelist Vault
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input 
                        type="text" 
                        placeholder="IMEI Prefix (e.g. 8697)" 
                        className="input-field" 
                        value={newPrefix.imeiPrefix}
                        style={{ margin: 0 }}
                        onChange={e => setNewPrefix({...newPrefix, imeiPrefix: e.target.value})}
                    />
                    <input 
                        type="text" 
                        placeholder="Vendor" 
                        className="input-field" 
                        value={newPrefix.vendor}
                        style={{ margin: 0 }}
                        onChange={e => setNewPrefix({...newPrefix, vendor: e.target.value})}
                    />
                    <button className="btn btn-primary" onClick={handleAddWhitelist}><Plus size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {whitelist.map(item => (
                        <div key={item.id} className="glass-bright" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>{item.imeiPrefix}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vendor: {item.vendor || "GENERIC TACTICAL"}</div>
                            </div>
                            <div className="badge badge-success">Sovereign Asset</div>
                        </div>
                    ))}
                    {whitelist.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Strategic vault empty. Local hardware restrictions inactive.</p>}
                </div>

                <div className="card" style={{ marginTop: '2.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed var(--primary)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <Database size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>Strategic Protocol Note</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>If the vault is empty, the system defaults to "Open Link" mode. Once any prefix is added, the platform will only accept hardware registered within those authorized ranges.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
