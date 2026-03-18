import { useState } from "react";
import { BarChart3, Download, Search, Filter, Calendar, Clock, ChevronRight, FileText, PieChart, Activity, TrendingUp } from "lucide-react";
import Loader from "../components/Loader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell } from "recharts";

const MOCK_CHART_DATA = [
  { time: "08:00", speed: 20 },
  { time: "09:00", speed: 45 },
  { time: "10:00", speed: 65 },
  { time: "11:00", speed: 30 },
  { time: "12:00", speed: 0 },
  { time: "13:00", speed: 25 },
  { time: "14:00", speed: 55 },
];

const MOCK_PIE_DATA = [
  { name: "Operational", value: 65, color: "var(--primary)" },
  { name: "Idle", value: 20, color: "var(--amber)" },
  { name: "Maintenance", value: 15, color: "var(--danger)" },
];

export default function Reports() {
  const [loading] = useState(false);
  const [reportType, setReportType] = useState("Summary");

  const handleExport = () => {
    // Strategic CSV Generation for Forensic Accounting
    const headers = "Timestamp,Latitude,Longitude,Velocity,Fuel Level,Odometer,Driver\n";
    const body = [
      `${new Date().toISOString()},18.5204,73.8567,45,82,1248,Alex Rover`,
      `${new Date(Date.now()-3600000).toISOString()},18.5215,73.8580,52,81,1246,Alex Rover`
    ].join('\n');
    
    const blob = new Blob([headers + body], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geosure_intel_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <Loader />;

  return (
    <div className="reports-page animate-fade-in" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Strategic Analytics</h2>
          <p style={{ color: 'var(--text-muted)' }}>Extract operational intelligence and performance metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn glass-bright" style={{ color: 'var(--primary)' }} onClick={handleExport}><Download size={18} /> Export Intelligence Package</button>
            <button className="btn-primary" style={{ padding: '0.85rem 1.5rem' }}>Generate New Report</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Asset Utilization', value: '84.2%', icon: <Smartphone size={22} />, color: 'var(--primary)', trend: '+3.1%' },
            { label: 'Operational Efficiency', value: '91.8%', icon: <TrendingUp size={22} />, color: 'var(--success)', trend: '+1.4%' },
            { label: 'Active Hours Total', value: '1,248h', icon: <Clock size={22} />, color: 'var(--accent-purple)', trend: '+124h' },
            { label: 'Avg Fuel Consumption', value: '12.4 L/100km', icon: <Fuel size={22} />, color: 'var(--danger)', trend: '-0.2%' },
          ].map((stat, idx) => (
             <div key={idx} className="glass widget-card" style={{ padding: '1.5rem', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        {stat.icon}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: stat.trend.includes('+') ? 'var(--success)' : 'var(--danger)', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '10px' }}>{stat.trend}</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.25rem' }}>{stat.label}</div>
             </div>
          ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Control Area */}
        <div className="glass widget-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className={`nav-link ${reportType === 'Activity Summary' ? 'active' : ''}`} onClick={() => setReportType('Activity Summary')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <BarChart3 size={18} /> Summary Feed
                 </button>
                 <button className={`nav-link ${reportType === 'Geozone Analysis' ? 'active' : ''}`} onClick={() => setReportType('Geozone Analysis')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <PieChart size={18} /> Zone Analytics
                 </button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <button className="btn-icon glass-bright" style={{ width: '40px', height: '40px', borderRadius: '12px' }}><Download size={18} /></button>
                 <button className="btn-icon glass-bright" style={{ width: '40px', height: '40px', borderRadius: '12px' }}><Filter size={18} /></button>
              </div>
           </div>

           <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center', padding: '3rem' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <BarChart3 size={48} style={{ opacity: 0.2 }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'white' }}>Intelligence Report: {reportType}</h3>
                <p style={{ maxWidth: '380px', marginBottom: '2.5rem' }}>Select your operational parameters to visualize strategic fleet intelligence and deployment metrics.</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="glass-bright" style={{ padding: '1rem 2rem', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.6 }}>Data Range</div>
                        <div style={{ fontWeight: 800 }}>Last 30 Cycles</div>
                    </div>
                    <div className="glass-bright" style={{ padding: '1rem 2rem', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.6 }}>Asset Filter</div>
                        <div style={{ fontWeight: 800 }}>Active Fleet Only</div>
                    </div>
                </div>
           </div>
        </div>

        {/* Right Configuration Panel */}
        <div className="glass widget-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Operational Parameters</h3>
           
           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Time Intelligence</label>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                 <Calendar size={18} className="input-icon" />
                 <select style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', cursor: 'pointer' }}>
                    <option style={{ background: '#1e293b' }}>Last 24 Hours</option>
                    <option style={{ background: '#1e293b' }}>Last 7 Days</option>
                    <option style={{ background: '#1e293b' }}>Current Fiscal Cycle</option>
                    <option style={{ background: '#1e293b' }}>Custom Time Frame</option>
                 </select>
              </div>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Strategic Focus</label>
              <div className="input-group">
                 <Search size={18} className="input-icon" />
                 <input type="text" placeholder="Global asset identifier..." style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
              </div>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Metrics to Capture</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {[
                    { icon: <Smartphone size={16} />, label: "Terminal Activity" },
                    { icon: <MapPin size={16} />, label: "Spatial Violations" },
                    { icon: <Clock size={16} />, label: "Downtime Diagnostics" },
                    { icon: <Fuel size={16} />, label: "Resource Consumption" }
                 ].map((metric, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--primary)' }}>{metric.icon}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{metric.label}</span>
                       </div>
                       <div style={{ width: '18px', height: '18px', border: '2px solid var(--primary)', borderRadius: '6px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                    </div>
                 ))}
              </div>
           </div>

           <button className="btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '1.1rem', borderRadius: '18px' }}>
              Compile Strategic Data
           </button>
        </div>
      </div>
    </div>
  );
}
