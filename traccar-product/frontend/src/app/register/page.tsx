"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, User, Mail, Building, MapPin, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function RegisterPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    address: '',
    password: ''
  });

  const { register, verifyOtp, completeProfile, loading, token, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // If we have a token but no name, we likely need to complete profile
    if (token && !user?.name) {
      setStep(3);
    } else if (token && user?.name) {
      // If profile is already complete, go to dashboard
      router.push('/dashboard');
    }
  }, [token, user, router]);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    try {
      await register(mobile);
      toast.success('Verification code sent to ' + mobile);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send code. Please try again.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    try {
      await verifyOtp(mobile, otp);
      toast.success('Mobile number verified!');
      // Note: step will be updated to 3 by the useEffect above
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await completeProfile(profile);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete profile');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020617] font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="w-full max-w-md z-10 transition-all duration-500">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-2 shadow-2xl shadow-blue-500/20 transition-all duration-500">
            <MapIcon className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
              {step === 3 ? 'Set up Profile' : 'Create Account'}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {step === 1 && "Start your journey with GeoSurePath"}
              {step === 2 && "Enter the code sent to your phone"}
              {step === 3 && "Tell us a bit about yourself"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 ml-1">Mobile Number</label>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="tel" 
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="w-full bg-slate-800/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-500 transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" /> Edit number
              </button>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 ml-1 text-center block">Verification Code</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-slate-800/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-center tracking-[0.5em] text-xl"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteProfile} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full bg-slate-800/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full bg-slate-800/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 ml-1">Company</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.company}
                      onChange={(e) => setProfile({...profile, company: e.target.value})}
                      placeholder="Acme Corp"
                      className="w-full bg-slate-800/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 ml-1">Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      placeholder="New York, US"
                      className="w-full bg-slate-800/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Create Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={profile.password}
                    onChange={(e) => setProfile({...profile, password: e.target.value})}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-800/40 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {step < 3 && (
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center">
              <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 font-bold transition-colors">
                Already have an account? Sign In
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-40">
           © 2024 GeoSurePath • Secure Registration
        </p>
      </div>
    </div>
  );
}

