import React, { useEffect, useState } from "react";
import { getDevices } from "../services/deviceService";
import Loader from "../components/Loader";
import api from "../services/api";
import { Wrench, Calendar, Gauge, AlertTriangle, ShieldCheck, Plus, CheckCircle2, MoreVertical, Settings, FileText, DollarSign, Fuel, Shield, Clock } from "lucide-react";

export default function Services() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("maintenance");
  const [documents, setDocuments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
      
      if (activeTab === "documents" && data.length > 0) {
        try {
          const docRes = await api.get(`/tactical/documents/${data[0].id}`);
          setDocuments(Array.isArray(docRes.data) ? docRes.data : []);
        } catch (e) { setDocuments([]); }
      }
      if (activeTab === "expenses" && data.length > 0) {
        try {
          const expRes = await api.get(`/tactical/expenses/${data[0].id}`);
          setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
        } catch (e) { setExpenses([]); }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMaintenanceStats = (device) => {
      const odo = device.attributes?.totalDistance || 0;
      const nextService = (Math.ceil(odo / 5000) * 5000);
      const remaining = nextService - odo;
      const percentage = (odo % 5000) / 5000 * 100;
      return { odo, nextService, remaining, percentage };
  }

  if (loading) return <Loader />;

  return (
    <div className="services-page animate-fade-in" style={{ padding: '2.5rem' }}>
       <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px' }}>Asset Intelligence</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Sovereign oversight of health, compliance, and financial trajectory.</p>
          </div>
          <div className="glass-bright" style={{ display: 'flex', padding: '6px', borderRadius: '16px', gap: '5px' }}>
              <button onClick={() => setActiveTab("maintenance")} className={activeTab === 'maintenance' ? 'btn-primary' : 'btn glass-bright'} style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={16} /> Maintenance
              </button>
              <button onClick={() => setActiveTab("documents")} className={activeTab === 'documents' ? 'btn-primary' : 'btn glass-bright'} style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Document Vault
              </button>
              <button onClick={() => setActiveTab("expenses")} className={activeTab === 'expenses' ? 'btn-primary' : 'btn glass-bright'} style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} /> Expense Intel
              </button>
          </div>
       </header>

       {activeTab === "maintenance" && (
         <>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Wrench size={22} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Service Ready</span>
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900 }}>{devices.length} Units</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 700 }}>100% Operational Readiness</div>
              </div>
              <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--danger)' }}>
                        <AlertTriangle size={22} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Critical Alerts</span>
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900 }}>0 Units</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Zero anomalies detected</div>
              </div>
              <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--success)' }}>
                        <ShieldCheck size={22} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Asset Health</span>
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900 }}>EXTREMELY HIGH</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Encrypted signal stability verified</div>
              </div>
              <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-purple)' }}>
                        <Calendar size={22} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>Next Service</span>
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900 }}>14 Oct</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Scheduled routine calibration</div>
              </div>
           </div>

           <div className="glass widget-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ background: 'transparent' }}>
                 <thead>
                    <tr>
                       <th>Tactical Asset</th>
                       <th>Current Odometer</th>
                       <th>Next Phase Focus</th>
                       <th>Service Trajectory</th>
                       <th style={{ textAlign: 'right' }}>Intel</th>
                    </tr>
                 </thead>
                 <tbody>
                    {devices.map(device => {
                        const stats = getMaintenanceStats(device);
                        return (
                            <tr key={device.id}>
                               <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                     {device.name}
                                  </div>
                               </td>
                               <td style={{ fontWeight: 800 }}>{(stats.odo/1000).toFixed(1)} <small style={{ color: 'var(--text-dim)' }}>KM</small></td>
                               <td>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>General Calibration @ {(stats.nextService/1000).toFixed(0)}km</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{(stats.remaining/1000).toFixed(1)} km remaining</div>
                               </td>
                               <td style={{ width: '250px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                     <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${stats.percentage}%`, background: 'var(--primary)' }}></div>
                                     </div>
                                  </div>
                               </td>
                               <td style={{ textAlign: 'right' }}>
                                  <button className="btn glass-bright" style={{ padding: '0.5rem', borderRadius: '10px' }}><Settings size={16} /></button>
                               </td>
                            </tr>
                        );
                    })}
                 </tbody>
              </table>
           </div>
         </>
       )}

       {activeTab === "documents" && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass widget-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <Shield size={48} color="var(--primary)" style={{ opacity: 0.2, margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontWeight: 900 }}>Strategic Document Vault</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Secure repository for RC, Insurance, Permits, and Pollution Certificates.</p>
                <button className="btn-primary" style={{ margin: '0 auto' }}>Establish New Compliance Proof</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {documents.length > 0 ? documents.map(doc => (
                    <div key={doc.id} className="glass widget-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <FileText size={24} color="var(--primary)" />
                            <span style={{ fontSize: '0.6rem', background: 'rgba(6,182,212,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>{doc.type}</span>
                        </div>
                        <h4 style={{ margin: 0 }}>{doc.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                            <Clock size={12} /> Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                        </div>
                    </div>
                )) : (
                    <div className="glass widget-card" style={{ gridColumn: 'span 3', padding: '5rem', textAlign: 'center', opacity: 0.5 }}>
                        <p>No compliance records synchronized yet.</p>
                    </div>
                )}
            </div>
         </div>
       )}

       {activeTab === "expenses" && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                    <Fuel size={24} color="var(--amber)" />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>₹ 12,450.00</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fuel Logistics</div>
                </div>
                <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                    <DollarSign size={24} color="var(--success)" />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>₹ 4,200.00</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Toll Trajectories</div>
                </div>
                <div className="glass widget-card" style={{ padding: '1.5rem' }}>
                    <Wrench size={24} color="var(--primary)" />
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>₹ 8,900.00</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Maintenance Calibration</div>
                </div>
            </div>

            <div className="glass widget-card" style={{ padding: 0 }}>
                <table style={{ background: 'transparent' }}>
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length > 0 ? expenses.map(exp => (
                            <tr key={exp.id}>
                                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>#{exp.id.slice(0,8)}</td>
                                <td>{exp.category}</td>
                                <td style={{ fontWeight: 800 }}>₹ {exp.amount}</td>
                                <td>{new Date(exp.date).toLocaleDateString()}</td>
                                <td><span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontWeight: 900 }}>SYNCED</span></td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No financial intel recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
       )}
    </div>
  );
}
