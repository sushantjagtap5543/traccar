"use client";

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useStatsStore } from '@/store/useStatsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Car, Bell, Map as MapIcon, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const dummyData = [
  { name: 'Mon', dist: 400, fuel: 240 },
  { name: 'Tue', dist: 300, fuel: 139 },
  { name: 'Wed', dist: 500, fuel: 980 },
  { name: 'Thu', dist: 278, fuel: 390 },
  { name: 'Fri', dist: 489, fuel: 480 },
  { name: 'Sat', dist: 239, fuel: 380 },
  { name: 'Sun', dist: 349, fuel: 430 },
];

export default function ClientDashboard() {
  const { adminStats, fetchAdminStats } = useStatsStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) fetchAdminStats(token);
  }, [token]);

  return (
    <main className="flex min-h-screen bg-background overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <h2 className="text-lg font-semibold uppercase tracking-tighter italic">Command Dashboard</h2>
        </header>

        <div className="p-8 space-y-8">
           {/* Top KPIs */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass p-6 rounded-2xl border border-border flex items-center gap-6 hover:border-primary/50 transition-all">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                   <Car className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Fleet Size</p>
                   <p className="text-2xl font-black">{adminStats?.totalVehicles || 0}</p>
                 </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-border flex items-center gap-6 hover:border-emerald-500/50 transition-all">
                 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                   <Activity className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Now</p>
                   <p className="text-2xl font-black">{adminStats?.onlineVehicles || 0}</p>
                 </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-border flex items-center gap-6 hover:border-red-500/50 transition-all">
                 <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                   <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Alerts Today</p>
                   <p className="text-2xl font-black text-red-400">{adminStats?.alertsToday || 0}</p>
                 </div>
              </div>

               <div className="glass p-6 rounded-2xl border border-border flex items-center gap-6 hover:border-blue-500/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Efficiency</p>
                    <p className="text-2xl font-black text-blue-400">
                      {adminStats?.totalVehicles > 0 
                        ? `${Math.round((adminStats.onlineVehicles / adminStats.totalVehicles) * 100)}%`
                        : '100%'}
                    </p>
                  </div>
               </div>
           </div>

           {/* Graphs Section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass p-8 rounded-3xl border border-border">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] italic">Distance Analytics (km)</h3>
                    <div className="flex gap-2">
                       <span className="w-2 h-2 rounded-full bg-primary" />
                       <span className="text-[10px] text-muted uppercase font-bold">Past 7 Days</span>
                    </div>
                 </div>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dummyData}>
                        <defs>
                          <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="dist" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDist)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="glass p-8 rounded-3xl border border-border">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 italic">Fleet status</h3>
                 <div className="space-y-6">
                     <div className="flex justify-between items-end border-b border-border pb-4">
                        <span className="text-xs text-muted font-bold uppercase">Online</span>
                        <span className="text-lg font-black text-emerald-400">
                          {adminStats?.totalVehicles > 0 
                            ? `${Math.round((adminStats.onlineVehicles / adminStats.totalVehicles) * 100)}%`
                            : '0%'}
                        </span>
                     </div>
                    <div className="flex justify-between items-end border-b border-border pb-4">
                       <span className="text-xs text-muted font-bold uppercase">Alert Ratio</span>
                       <span className="text-lg font-black text-blue-400">1.2/dev</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-border pb-4">
                       <span className="text-xs text-muted font-bold uppercase">Active Clients</span>
                       <span className="text-lg font-black text-amber-400">{adminStats?.activeClients || 0}</span>
                    </div>
                 </div>
                 <button className="w-full bg-white/5 border border-border rounded-xl py-3 mt-8 text-[10px] font-bold uppercase hover:bg-white/10 transition-all">
                    System health: 100%
                 </button>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
