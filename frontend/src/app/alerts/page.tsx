"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Bell, AlertTriangle, Shield, Clock, MapPin, Filter, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')).state.token : '';
      const res = await axios.get(`${apiBase}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')).state.token : '';
      await axios.patch(`${apiBase}/alerts/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      toast.success('Alert marked as read');
    } catch (err) {
      toast.error('Failed to update alert');
    }
  };

  return (
    <main className="flex min-h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Alert Engine Notifications</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs bg-white/5 border border-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="text-xs bg-primary text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-all">
              Mark All as Read
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-4">
            {loading ? (
              <div className="flex justify-center p-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
                <div className="glass p-12 rounded-3xl border border-border flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                        <Shield className="w-8 h-8 text-muted" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">System Secure</h3>
                    <p className="text-muted text-sm max-w-sm">No critical alerts detected in the last 24 hours. Your fleet is operating within normal parameters.</p>
                </div>
            ) : (
              alerts.map((alert: any) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "glass p-6 rounded-2xl border transition-all flex items-start gap-4",
                    alert.isRead ? "border-border opacity-70" : "border-primary/30 shadow-lg shadow-primary/5"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    alert.type === 'overspeed' ? "bg-red-500/10 text-red-500" :
                    alert.type === 'geofence' ? "bg-blue-500/10 text-blue-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white capitalize">{alert.type.replace('_', ' ')}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-muted uppercase font-bold tracking-widest">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-muted mb-4">{alert.message}</p>
                    
                    <div className="flex items-center gap-6">
                        {alert.latitude && (
                            <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                                <MapPin className="w-3 h-3" />
                                View on Map
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted font-bold">
                            <Shield className="w-3 h-3" />
                            Vehicle: {alert.vehicleId.split('-')[0]}...
                        </div>
                    </div>
                  </div>

                  {!alert.isRead && (
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            )}

            {/* Simulated Live Alert for Demo (Optional) */}
            <div className="glass p-6 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-start gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 rounded-xl bg-red-500/20 text-red-500 relative">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 relative">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-red-400">🚨 Critical: SOS Panic Button</h4>
                        <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Live</span>
                    </div>
                    <p className="text-sm text-white/90 font-medium">SOS alarm triggered on Vehicle: TRUCK-8829. Immediate action required!</p>
                    <div className="mt-4 flex gap-4">
                        <button className="text-[10px] bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg">Emergency Protocol</button>
                        <button className="text-[10px] border border-red-500/30 text-red-400 font-bold px-4 py-1.5 rounded-lg hover:bg-red-500/10">Dispatch Fleet</button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
