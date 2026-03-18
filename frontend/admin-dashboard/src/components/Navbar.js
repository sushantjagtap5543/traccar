import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Users, Bell, BarChart3, LogOut, ShieldCheck, Activity, DollarSign, MapPin, Settings, Cpu } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Devices", path: "/admin/devices", icon: <Smartphone size={18} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Alerts", path: "/admin/alerts", icon: <Bell size={18} /> },
    { name: "Geofences", path: "/admin/geofences", icon: <MapPin size={18} /> },
    { name: "Reports", path: "/admin/reports", icon: <BarChart3 size={18} /> },
    { name: "Billing", path: "/admin/billing", icon: <DollarSign size={18} /> },
    { name: "System Health", path: "/admin/system-health", icon: <Activity size={18} /> },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: <ShieldCheck size={18} /> },
    { name: "Debugger", path: "/admin/debugger", icon: <Cpu size={18} /> },
    { name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="logo-circle" style={{ 
          width: '44px', height: '44px', borderRadius: '14px', 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px var(--primary-glow)'
        }}>
          <ShieldCheck size={24} color="white" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.8px', color: 'white', margin: 0, lineHeight: 1 }}>GeoSurePath</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>Core Admin Panel</span>
        </div>
      </div>

      <div className="nav-links">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
          <button className="nav-link" style={{ 
               background: 'rgba(244, 63, 94, 0.1)', 
               color: 'var(--danger)',
               border: '1px solid rgba(244, 63, 94, 0.2)',
               padding: '0.75rem 1.25rem'
          }} onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
          }}>
            <LogOut size={18} />
            <span>Terminate Admin Session</span>
          </button>
      </div>
    </nav>
  );
}
