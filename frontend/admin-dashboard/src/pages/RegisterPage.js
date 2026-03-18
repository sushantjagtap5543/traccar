import React, { useState } from "react";
import { register } from "../api/register";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Mail, Phone, Lock, Zap, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(profile);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please verify your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-light">
      <div className="auth-card-light animate-fade-in" style={{ maxWidth: '560px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
          }}>
            <ShieldCheck size={42} color="var(--danger)" />
          </div>
          <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>Initialize Admin</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.25rem' }}>Establish core system authority credentials</p>
        </div>

        {error && (
          <div className="error-msg animate-fade-in" style={{ 
            background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', padding: '14px', 
            borderRadius: '16px', border: '1px solid rgba(244, 63, 94, 0.2)', 
            fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="input-group-light" style={{ textAlign: 'left' }}>
              <label>Full Name</label>
              <span className="input-icon"><User size={20} /></span>
              <input
                type="text"
                placeholder="Admin Name"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>
            <div className="input-group-light" style={{ textAlign: 'left' }}>
              <label>Security Email</label>
              <span className="input-icon"><Mail size={20} /></span>
              <input
                type="email"
                placeholder="admin@geosure.com"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group-light" style={{ textAlign: 'left' }}>
            <label>Secure Mobile</label>
            <span className="input-icon"><Phone size={20} /></span>
            <input
              type="tel"
              placeholder="98765 43210"
              value={profile.mobile}
              onChange={e => setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, '') })}
              maxLength={10}
              required
            />
          </div>

          <div className="input-group-light" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            <label>Master Passkey</label>
            <span className="input-icon"><Lock size={20} /></span>
            <input
              type="password"
              placeholder="••••••••"
              value={profile.password}
              onChange={e => setProfile({ ...profile, password: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '1.1rem', borderRadius: '18px', fontSize: '1rem', background: 'linear-gradient(135deg, var(--danger) 0%, var(--accent-purple) 100%)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} className="animate-pulse" /> Finalizing Encryption...
              </span>
            ) : <>Initialize Core Authority <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Already have authority?{" "}
            <Link to="/login" style={{ color: 'var(--danger)', fontWeight: '800', textDecoration: 'none', marginLeft: '4px' }}>
              Secure Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

