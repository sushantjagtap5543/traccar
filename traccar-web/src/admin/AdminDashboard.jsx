import React, { useEffect, useState } from "react";

export default function AdminDashboard() {

  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch("/api/dashboard/admin")
      .then(r => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
           <p className="text-slate-400 text-sm uppercase font-bold">Total Vehicles</p>
           <p className="text-3xl font-black">{stats.totalVehicles || 0}</p>
        </div>
        <div className="p-6 bg-emerald-900/20 rounded-xl shadow-lg border border-emerald-500/30">
           <p className="text-emerald-400 text-sm uppercase font-bold">Online</p>
           <p className="text-3xl font-black text-emerald-400">{stats.onlineVehicles || 0}</p>
        </div>
        <div className="p-6 bg-red-900/20 rounded-xl shadow-lg border border-red-500/30">
           <p className="text-red-400 text-sm uppercase font-bold">Offline</p>
           <p className="text-3xl font-black text-red-400">{stats.offlineVehicles || 0}</p>
        </div>
        <div className="p-6 bg-blue-900/20 rounded-xl shadow-lg border border-blue-500/30">
           <p className="text-blue-400 text-sm uppercase font-bold">Alerts Today</p>
           <p className="text-3xl font-black text-blue-400">{stats.alerts || 0}</p>
        </div>
      </div>
    </div>
  );
}
