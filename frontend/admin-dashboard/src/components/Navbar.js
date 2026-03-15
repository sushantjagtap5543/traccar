import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
        Traccar Admin
      </div>
      <div className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/devices">Devices</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </div>
      <button className="btn btn-primary" onClick={() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }}>
        Logout
      </button>
    </nav>
  );
}
