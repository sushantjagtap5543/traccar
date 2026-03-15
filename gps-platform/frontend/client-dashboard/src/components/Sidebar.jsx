import { NavLink } from "react-router-dom";
import { LayoutDashboard, Smartphone, BarChart3, Settings, ShieldCheck } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Devices", path: "/devices", icon: <Smartphone size={20} /> },
    { name: "Reports", path: "/reports", icon: <BarChart3 size={20} /> },
    { name: "Admin", path: "/admin", icon: <ShieldCheck size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

    </aside>
  );
}
