"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Users, Smartphone, CreditCard, Activity, Search, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStatsStore } from '@/store/useStatsStore';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';

export default function AdminDashboardPage() {
  const { adminStats, fetchAdminStats } = useStatsStore();
  const { token } = useAuthStore();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (token) {
      fetchAdminStats(token);
      fetchClients();
    }
  }, [token]);

  const fetchClients = async () => {
    try {
      const res = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(res.data);
    } catch (e) {
      console.error('Failed to fetch clients');
    }
  };

  return (
    <main className="flex min-h-screen bg-background overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <h2 className="text-lg font-semibold uppercase tracking-tighter italic">Admin Command Center</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Search IMEI or Users..." 
                className="bg-white/5 border border-border rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all w-64"
              />
            </div>
            <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" />
              Approve New IMEI
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] text-muted mb-1 uppercase font-bold tracking-widest">Total Vehicles</p>
              <p className="text-xl font-black">{adminStats?.totalVehicles || 0}</p>
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '85%' }} />
              </div>
            </div>
            
            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-emerald-500 mb-1 uppercase tracking-widest">Online</p>
              <p className="text-xl font-black">{adminStats?.onlineVehicles || 0}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-muted">Active Pulse</span>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Offline</p>
              <p className="text-xl font-black">{adminStats?.offlineVehicles || 0}</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-red-500 mb-1 uppercase tracking-widest">Alerts Today</p>
              <p className="text-xl font-black">{adminStats?.alertsToday || 0}</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-orange-400 mb-1 uppercase tracking-widest">Active Clients</p>
              <p className="text-xl font-black">{adminStats?.activeClients || 0}</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Efficiency</p>
              <p className="text-xl font-black">99.9%</p>
            </div>
          </div>

          {/* Client Management */}
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest">Global Clients</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Client Name</th>
                    <th className="px-6 py-3 font-semibold">Admin Email</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Joined At</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white uppercase">{client.name}</td>
                      <td className="px-6 py-4 text-muted">{client.email}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          client.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>{client.status || 'Active'}</span>
                      </td>
                      <td className="px-6 py-4 text-muted">{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button className="text-primary hover:underline font-bold text-[10px] uppercase">Control</button>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted italic">No clients registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs */}
          <div className="glass rounded-2xl border border-border p-6 font-mono text-[9px] text-muted space-y-2 bg-slate-900/50">
            <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-[0.3em]">Kernel Output</h3>
            <p className="text-emerald-500/70">{`[${new Date().toLocaleTimeString()}] SUCCESS: WebSocket Position Cluster initialized.`}</p>
            <p className="text-blue-500/70">{`[${new Date().toLocaleTimeString()}] INFO: Polling Traccar Core at ${process.env.NEXT_PUBLIC_API_URL}`}</p>
            <p className="text-amber-500/70">{`[${new Date().toLocaleTimeString()}] WARN: SMTP Gateway in test mode.`}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
