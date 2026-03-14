"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Car, Plus, Search, MapPin, Gauge, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VehiclesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  
  return (
    <main className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <h2 className="text-lg font-semibold">My Fleet</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Register Device
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-6 rounded-2xl border border-border group hover:border-primary/50 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1">Active</span>
                    <span className="text-[10px] font-medium text-muted">IMEI: 8645...{i}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Toyota Fortuner GS-00{i}</h3>
                    <p className="text-xs text-muted">Model: TK-103 Eco</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                       <Gauge className="w-4 h-4 text-muted" />
                       <span className="text-xs font-medium">{10 * i} km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Activity className="w-4 h-4 text-muted" />
                       <span className="text-xs font-medium">Ignition {i % 2 === 0 ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-lg transition-all">Location History</button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-lg transition-all border border-transparent hover:border-red-500/20 hover:text-red-400">Manage</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Registration Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md glass p-8 rounded-2xl border border-border shadow-2xl scale-in">
              <h3 className="text-xl font-bold mb-2">Register New Device</h3>
              <p className="text-sm text-muted mb-6">Enter your GeoSurePath device details to link it to the server.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-2">Device Name</label>
                  <input type="text" placeholder="e.g. My Truck 01" className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-2">IMEI Number</label>
                  <input type="text" placeholder="15-digit IMEI" className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-white/5 transition-all">Cancel</button>
                  <button className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">Link Device</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
