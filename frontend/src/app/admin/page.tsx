"use client";

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Users, Smartphone, CreditCard, Activity, Search, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  return (
    <main className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <h2 className="text-lg font-semibold">Admin Command Center</h2>
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
              <p className="text-xs text-muted mb-1 uppercase font-bold tracking-tighter">Total Vehicles</p>
              <p className="text-xl font-bold">4,120</p>
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%]" />
              </div>
            </div>
            
            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-xs font-bold text-emerald-500 mb-1 uppercase tracking-tighter">Active Now</p>
              <p className="text-xl font-bold">3,210</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted">78% Utilization</span>
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Offline</p>
              <p className="text-xl font-bold">910</p>
              <p className="mt-2 text-[10px] text-muted">Inactivity > 24h</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-xs font-bold text-red-500 mb-1 uppercase tracking-tighter">Alerts Today</p>
              <p className="text-xl font-bold">142</p>
              <p className="mt-2 text-[10px] text-red-400 font-bold">+14% vs yesterday</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-xs font-bold text-orange-400 mb-1 uppercase tracking-tighter">Geofence Viol.</p>
              <p className="text-xl font-bold">56</p>
              <p className="mt-2 text-[10px] text-muted">Unauthorized exits</p>
            </div>

            <div className="glass p-4 rounded-xl border border-border">
              <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-tighter">Dist. Today</p>
              <p className="text-xl font-bold">12.4k <span className="text-[10px] font-normal">km</span></p>
              <p className="mt-2 text-[10px] text-muted">Fleet-wide total</p>
            </div>
          </div>

          {/* Client Management & Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
             <div className="glass rounded-2xl border border-border overflow-hidden">
               <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-white/5">
                 <h3 className="text-sm font-semibold uppercase tracking-widest">Client Portal Management</h3>
                 <button className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-lg border border-primary/30 font-bold">Add New Client</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-white/5 text-muted uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-3 font-semibold">Client Name</th>
                       <th className="px-6 py-3 font-semibold">Admin User</th>
                       <th className="px-6 py-3 font-semibold">Fleet Size</th>
                       <th className="px-6 py-3 font-semibold">Plan</th>
                       <th className="px-6 py-3 font-semibold">Status</th>
                       <th className="px-6 py-3 font-semibold">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {[
                       { name: 'Elite Logistics', user: 'admin@elitelog.com', fleet: 150, plan: 'Enterprise', status: 'Active' },
                       { name: 'SafeWay Couriers', user: 'jason@safeway.com', fleet: 45, plan: 'Premium', status: 'Active' },
                       { name: 'FastTrack Rentals', user: 'mira@fasttrack.in', fleet: 12, plan: 'Free', status: 'Suspended' },
                     ].map((client) => (
                       <tr key={client.name} className="hover:bg-white/5 transition-colors">
                         <td className="px-6 py-4 font-bold text-white">{client.name}</td>
                         <td className="px-6 py-4 text-muted">{client.user}</td>
                         <td className="px-6 py-4">{client.fleet} Vehicles</td>
                         <td className="px-6 py-4 tracking-tighter font-bold">{client.plan}</td>
                         <td className="px-6 py-4">
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[10px] font-bold",
                             client.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                           )}>{client.status}</span>
                         </td>
                         <td className="px-6 py-4">
                           <button className="text-primary hover:underline font-bold">Manage</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Registrations can go here */}
          </div>

          {/* System Logs */}
          <div className="glass rounded-2xl border border-border p-6 font-mono text-[10px] text-muted space-y-2">
            <h3 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">Live System Logs</h3>
            <p className="text-emerald-500/70">[10:45:12] SUCCESS: Telemetry received from IMEI 8645... (lat: 28.61, lng: 77.20)</p>
            <p className="text-blue-500/70">[10:44:55] INFO: Ignition ON command sent to Device ID 442</p>
            <p className="text-amber-500/70">[10:44:30] WARN: Low battery alert triggered for User ID 8221</p>
            <p className="text-red-500/70">[10:44:10] ERROR: Traccar connection timeout for cluster-asia-1</p>
          </div>
        </div>
      </div>
    </main>
  );
}
