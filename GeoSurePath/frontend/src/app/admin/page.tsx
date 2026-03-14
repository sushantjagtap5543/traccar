"use client";

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Users, Smartphone, CreditCard, Activity, Search, Plus, Filter } from 'lucide-react';

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500">+12%</span>
              </div>
              <p className="text-2xl font-bold">1,248</p>
              <p className="text-xs text-muted">Total Active Users</p>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500">+5%</span>
              </div>
              <p className="text-2xl font-bold">3,512</p>
              <p className="text-xs text-muted">Registered Devices</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-2" />
              </div>
              <p className="text-2xl font-bold">2,890</p>
              <p className="text-xs text-muted">Devices Online</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">FREEMIUM</p>
              <p className="text-xs text-muted">Active Plan</p>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Registrations */}
            <div className="glass rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold italic">Recent Device Registrations</h3>
                <Filter className="w-4 h-4 text-muted cursor-pointer" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-semibold">IMEI</th>
                      <th className="px-6 py-3 font-semibold">Model</th>
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono">8645220451{i}982</td>
                        <td className="px-6 py-4">TK-103 Premium</td>
                        <td className="px-6 py-4">user_{i}@example.com</td>
                        <td className="px-6 py-4">
                          <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subscription Expiry Alert */}
            <div className="glass rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold italic">Subscription Monitoring</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">IMEI: ...8829{i}</p>
                          <p className="text-[10px] text-muted text-orange-400">Expiring in {i * 10} days</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-white/10">Extend Plan</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="glass rounded-2xl border border-border p-6 font-mono text-[10px] text-muted space-y-2">
            <h3 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">Live System Logs</h3>
            <p className="text-emerald-500/70">[10:45:12] SUCCESS: Telemetry received from IMEI 8645... (lat: 28.61, lng: 77.20)</p>
            <p className="text-blue-500/70">[10:44:55] INFO: Ignition ON command sent to Device ID 442</p>
            <p className="text-amber-500/70">[10:44:30] WARN: Low battery alert triggered for User ID 8221</p>
            <p className="text-red-500/70">[10:44:10] ERROR: Traccar connection timeout for cluster-asia-1</p>
            <p className="text-muted/50">[10:43:55] DEBUG: Queue cleanup task completed in 120ms</p>
          </div>
        </div>
      </div>
    </main>
  );
}
