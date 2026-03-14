"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Map as MapIcon, Plus, Trash2, Globe, Shield, Bell } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

import { GeofencePicker } from '@/components/GeofencePicker';
import { useAuthStore } from '@/store/useAuthStore';

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lat: '20.5937',
    lng: '78.9629',
    radius: '500',
    alertType: 'both'
  });

  useEffect(() => {
    if (token) fetchGeofences();
  }, [token]);

  const fetchGeofences = async () => {
    try {
      const res = await axios.get('/api/geofences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeofences(res.data);
    } catch (e) {
      toast.error('Failed to load geofences');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/geofences', {
        name: formData.name,
        description: formData.description,
        alertType: formData.alertType,
        area: {
          type: 'Circle',
          center: [parseFloat(formData.lng), parseFloat(formData.lat)],
          radius: parseInt(formData.radius)
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Geofence created successfully');
      setShowForm(false);
      fetchGeofences();
    } catch (e) {
      toast.error('Creation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`/api/geofences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.info('Geofence removed');
      fetchGeofences();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <main className="flex min-h-screen bg-background overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold uppercase tracking-tighter">GeoProtection zones</h2>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white text-[10px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-primary/20 hover:shadow-lg transition-all uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Close Editor' : 'Define New Zone'}
          </button>
        </header>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Geofence List */}
          <div className="lg:col-span-2 space-y-4">
            {geofences.length === 0 && (
              <div className="glass p-20 text-center rounded-2xl border border-dashed border-border">
                 <Shield className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
                 <p className="text-muted text-sm italic">No active security zones defined.</p>
              </div>
            )}
            
            {geofences.map((gf: any) => (
              <div key={gf.id} className="glass p-6 rounded-2xl border border-border flex items-center justify-between hover:border-primary/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <MapIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase">{gf.name}</h3>
                    <p className="text-[10px] text-muted">{gf.description || 'Virtual security perimeter'}</p>
                    <div className="flex gap-4 mt-1">
                       <span className="text-[9px] font-bold text-emerald-400 uppercase">Radius: {gf.area?.radius}m</span>
                       <span className="text-[9px] font-bold text-blue-400 uppercase flex items-center gap-1">
                         <Bell className="w-2.5 h-2.5" /> {gf.alertType}
                       </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(gf.id)}
                  className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Form Side panel */}
          <div className={showForm ? "block transition-all" : "hidden lg:block opacity-40 grayscale pointer-events-none"}>
            <div className="glass p-8 rounded-2xl border border-border sticky top-24">
              <h3 className="text-xs font-bold uppercase mb-6 tracking-widest text-primary">Zone Configuration</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Zone Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Warehouse A"
                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-xs text-white outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Geographic Location</label>
                  <GeofencePicker 
                     lat={parseFloat(formData.lat)} 
                     lng={parseFloat(formData.lng)} 
                     radius={parseInt(formData.radius)}
                     onChange={(lat, lng) => setFormData({...formData, lat: lat.toString(), lng: lng.toString()})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Radius (meters): {formData.radius}m</label>
                  <input 
                    type="range" 
                    min="100"
                    max="5000"
                    step="100"
                    required
                    value={formData.radius}
                    onChange={e => setFormData({...formData, radius: e.target.value})}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Alert On</label>
                  <select 
                    value={formData.alertType}
                    onChange={e => setFormData({...formData, alertType: e.target.value})}
                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-xs text-white outline-none focus:border-primary"
                  >
                    <option value="both" className="bg-slate-900">Both (Enter & Exit)</option>
                    <option value="enter" className="bg-slate-900">Entrance Only</option>
                    <option value="exit" className="bg-slate-900">Exit Only</option>
                  </select>
                </div>

                <button className="w-full bg-primary text-white text-[10px] font-black py-4 rounded-xl mt-4 hover:shadow-primary/30 hover:shadow-xl transition-all uppercase tracking-[0.2em]">
                  Deploy Security Zone
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
