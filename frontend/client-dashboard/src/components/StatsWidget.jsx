import { Activity, ShieldCheck, Map as MapIcon, Clock } from "lucide-react";

export default function StatsWidget({ stats }) {
  const items = [
    { label: "Active", value: stats.active, icon: <Activity size={18} color="var(--success)" />, color: "var(--success)" },
    { label: "Alerts", value: stats.alerts, icon: <ShieldCheck size={18} color="var(--danger)" />, color: "var(--danger)" },
    { label: "Total Fleet", value: stats.total, icon: <MapIcon size={18} color="var(--primary)" />, color: "var(--primary)" },
  ];

  return (
    <div className="floating-panel panel-top animate-slide-up">
      {items.map((item, i) => (
        <div key={i} className="widget-card glass" style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', background: `${item.color}15`, borderRadius: '10px' }}>
            {item.icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{item.label}</span>
          </div>
        </div>
      ))}
      <div className="widget-card glass" style={{ flex: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <Clock size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
         <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>12:45 PM</span>
      </div>
    </div>
  );
}
