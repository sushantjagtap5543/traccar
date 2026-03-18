import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Phone, Lock, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react";

export default function Login() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6789]\d{9}$/.test(whatsappNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      await loginUser(whatsappNumber, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Login failed. Please check your credentials."
      );
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
          <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>GeoSurePath</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.25rem' }}>Secure Intelligence Portal</p>
        </div>

        {error && (
          <div className="error-msg animate-fade-in" style={{ 
            background: 'rgba(244, 63, 94, 0.12)', 
            color: '#fb7185', 
            padding: '14px', 
            borderRadius: '16px', 
            border: '1px solid rgba(244, 63, 94, 0.2)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group-light">
            <label>WhatsApp Number</label>
            <span className="input-icon"><Phone size={20} /></span>
            <input
              type="text"
              placeholder="98765 43210"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>

          <div className="input-group-light" style={{ marginBottom: '2.5rem' }}>
            <label>Console Password</label>
            <span className="input-icon"><Lock size={20} /></span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <Zap size={18} className="animate-pulse" /> Establishing Link...
              </span>
            ) : "Establish Connection"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            New operative?{" "}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none', marginLeft: '4px' }}>
              Create Account
            </Link>
          </p>
          <div style={{ marginTop: '14px' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textDecoration: 'none', opacity: 0.8 }}>
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
