"use client";

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MapView } from '@/components/MapView';
import { VehicleList } from '@/components/VehicleList';
import { SocketController } from '@/components/SocketController';
import { Bell, ShieldAlert, Zap, Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen bg-background overflow-hidden">
      <SocketController />
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold">Live Fleet Tracking</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-emerald-500">System Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-muted" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex relative">
          {/* Map Section */}
          <div className="flex-1 relative">
            <MapView />
          </div>

          {/* Right Panel */}
          <div className="w-80 flex flex-col">
            <VehicleList />
            
            {/* Quick Stats / Alerts summary */}
            <div className="h-1/3 bg-card/30 glass border-t border-border p-4 overflow-y-auto">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Overspeed detected</p>
                    <p className="text-[10px] text-muted">Vehicle GS-102 @ 10:45 AM</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Ignition ON</p>
                    <p className="text-[10px] text-muted">Vehicle GS-088 @ 10:42 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
