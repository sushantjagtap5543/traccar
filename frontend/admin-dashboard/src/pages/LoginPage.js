import React, { useState } from "react";
import { login } from "../api/session";
import { ShieldCheck, Mail, Lock, Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-light">
      <div className="auth-card-light animate-fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'
          }}>
            <ShieldCheck size={42} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>GeoSure Admin</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.25rem' }}>Core Intelligence Control</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group-light">
            <label>Admin Access Email</label>
            <span className="input-icon"><Mail size={20} /></span>
            <input
              type="email"
              placeholder="admin@geosure.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-light" style={{ marginBottom: '2.5rem' }}>
            <label>Security Key</label>
            <span className="input-icon"><Lock size={20} /></span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ paddingRight: '4rem' }}
            />
             <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', right: '1.25rem', top: '2.6rem',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '1.1rem', borderRadius: '18px', fontSize: '1rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} className="animate-pulse" /> Finalizing Entry...
              </span>
            ) : "Establish Secure Access"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                For operational support, contact systems administrator.
            </p>
        </div>
      </div>
      
      <style>{`
        .animate-pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
