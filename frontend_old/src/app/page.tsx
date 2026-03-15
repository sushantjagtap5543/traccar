"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, ShieldCheck, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(mobile, password);
      toast.success('Access Granted. Initializing Command Center...');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unauthorized Access');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <MapIcon className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            GeoSurePath
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60 italic">Precision Intelligence Platform</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Terminal ID (Mobile)</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter Registered Mobile"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary/50 transition-all text-white font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Access Protocol (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Encrypted Code"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-primary/50 transition-all text-white font-medium"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group uppercase text-xs tracking-widest"
            >
              {loading ? 'Validating...' : (
                <>
                  Connect to Satellite
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] text-muted-foreground uppercase font-bold">Encrypted 256-bit AES</span>
            </div>
            <a href="#" className="text-[9px] text-primary hover:underline font-bold uppercase">System Reset</a>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-30">
          V 0.1.4-PROD | SATELLITE LINK ACTIVE
        </p>
      </div>
    </div>
  );
}
