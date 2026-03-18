import { LogOut, User, Bell, Settings, Search, Map as MapIcon, History, Smartphone, ShieldAlert, BarChart3, ShieldCheck, UserCheck, DollarSign, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const { user, logoutUser } = useAuth();

  const navItems = [
    { name: "Live Tactical", path: "/dashboard", icon: <MapIcon size={18} /> },
    { name: "Sortie History", path: "/history", icon: <History size={18} /> },
    { name: "Fleet Registry", path: "/devices", icon: <Smartphone size={18} /> },
    { name: "Spatial Intel", path: "/geofencing", icon: <ShieldAlert size={18} /> },
    { name: "Human Intelligence", path: "/drivers", icon: <UserCheck size={18} /> },
    { name: "Tactical Alerts", path: "/alerts", icon: <Bell size={18} /> },
    { name: "Fleet Reports", path: "/reports", icon: <BarChart3 size={18} /> },
    { name: "Fleet Maintenance", path: "/maintenance", icon: <Wrench size={18} /> },
    { name: "Financial Intel", path: "/billing", icon: <DollarSign size={18} /> },
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
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2.5px', marginTop: '2px' }}>Intelligence Console</span>
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
        <div className="search-bar glass-bright" style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem', 
          padding: '0 1.25rem', borderRadius: '14px', height: '46px', width: '280px' 
        }}>
            <Search size={18} color="var(--text-dim)" />
            <input type="text" placeholder="Global search..." style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', width: '100%', outline: 'none' }} />
        </div>

        <button className="btn-icon glass-bright" style={{ position: 'relative', width: '46px', height: '46px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <Bell size={20} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid #0F172A' }}></div>
        </button>
        
        <div className="user-profile-dropdown glass-bright" style={{ 
          padding: '4px 6px 4px 14px', borderRadius: '16px', display: 'flex', 
          alignItems: 'center', gap: '1rem', cursor: 'pointer', height: '46px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{user?.full_name || user?.name || "Operative"}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Field Operative</span>
          </div>
          <div style={{ 
            width: '34px', height: '34px', borderRadius: '10px', 
            background: 'var(--primary)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', color: '#0F172A' 
          }}>
             <User size={20} />
          </div>
        </div>

        <button onClick={logoutUser} className="btn-icon" title="Terminate Session" style={{ 
          color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.1)', 
          border: '1px solid rgba(244, 63, 94, 0.2)', width: '46px', height: '46px', borderRadius: '14px' 
        }}>
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
