"use client";

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Bell, ShieldAlert, Zap, Search, Filter, Trash2, CheckCircle } from 'lucide-react';

export default function AlertsPage() {
  return (
    <main className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <h2 className="text-lg font-semibold">Alert History</h2>
          <div className="flex items-center gap-4">
            <button className="text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/5 transition-all text-muted">
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
            <button className="text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-400/10 transition-all text-red-400">
              <Trash2 className="w-4 h-4" />
              Clear history
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass p-5 rounded-2xl border border-border flex items-start gap-4 hover:bg-white/5 transition-all group">
                <div className={cn(
                  "p-3 rounded-xl shrink-0",
                  i % 3 === 0 ? "bg-red-500/10 text-red-500" : 
                  i % 3 === 1 ? "bg-amber-500/10 text-amber-500" : 
                  "bg-blue-500/10 text-blue-500"
                )}>
                  {i % 3 === 0 ? <ShieldAlert className="w-6 h-6" /> : 
                   i % 3 === 1 ? <Zap className="w-6 h-6" /> : 
                   <Bell className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm">
                      {i % 3 === 0 ? 'Overspeed Alert' : 
                       i % 3 === 1 ? 'Ignition State Change' : 
                       'Geofence Exit'}
                    </h3>
                    <span className="text-[10px] text-muted font-medium uppercase">2 hours ago</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-3">
                    {i % 3 === 0 ? 'Vehicle GS-001 exceeded speed limit of 80 km/h. Recorded speed: 112 km/h.' : 
                     i % 3 === 1 ? 'Ignition was turned ON for vehicle GS-004 at location 28.61, 77.21.' : 
                     'Vehicle GS-002 exited the Delhi Central geofence zone.'}
                  </p>
                  
                  <div className="flex gap-4">
                    <button className="text-[10px] font-bold text-primary hover:underline">View on Map</button>
                    <button className="text-[10px] font-bold text-muted hover:text-white transition-colors">Details</button>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper for classes (already added in utils.ts)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
