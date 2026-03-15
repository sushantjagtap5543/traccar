import { LogOut, User, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useAuth();

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <span className="logo-icon">📡</span>
        <h1>Traccar Enterprise</h1>
      </div>
      <div className="nav-actions">
        <button className="nav-icon-btn"><Bell size={20} /></button>
        <div className="user-profile">
          <User size={20} />
          <span>{user?.name || "User"}</span>
        </div>
        <button onClick={logoutUser} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

    </nav>
  );
}
