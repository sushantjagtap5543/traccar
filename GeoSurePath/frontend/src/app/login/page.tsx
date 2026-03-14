"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Map as MapIcon, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${apiBase}/auth/register`, { mobile });
      setStep('otp');
      toast.success('OTP sent to your mobile');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${apiBase}/auth/verify`, { mobile, code: otp });
      setAuth(res.data.user || { mobile, id: 'temp', role: 'user', name: 'User', email: '' }, res.data.accessToken);
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Decorative background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] -z-10" />

      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <MapIcon className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">GeoSurePath</h1>
          <p className="text-sm text-muted">Secure Fleet Management Platform</p>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-2">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="tel"
                  placeholder="+91 00000 00000"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-10 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-2">6-Digit OTP Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text"
                  placeholder="000000"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-border rounded-xl px-10 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.5em] text-center"
                />
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setStep('mobile')}
              className="w-full text-xs text-muted hover:text-white transition-colors"
            >
              Change mobile number
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-border flex justify-between text-[10px] text-muted uppercase tracking-widest font-bold">
          <span>Production Ready</span>
          <span>Free Edition</span>
        </div>
      </div>
    </div>
  );
}
