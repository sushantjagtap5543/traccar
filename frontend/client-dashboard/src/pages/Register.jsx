import { useState } from "react";
import { requestOtp, verifyOtp, completeProfile } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Key, User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, Zap } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [testingOtp, setTestingOtp] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6789]\d{9}$/.test(whatsappNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const data = await requestOtp(whatsappNumber);
      if (data.testingOtp) {
        setTestingOtp(data.testingOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyOtp(whatsappNumber, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await completeProfile(whatsappNumber, profile.name, profile.email, profile.password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
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
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'
          }}>
            <ShieldCheck size={42} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>
            {step === 3 ? "Operative Profile" : "GeoSure Access"}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.25rem' }}>
            {step === 1 && "Initialize your next-gen intelligence journey"}
            {step === 2 && `Verification code sent to +91 ${whatsappNumber}`}
            {step === 3 && "Establish your permanent console credentials"}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="steps-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem', fontWeight: '800',
                background: step >= s ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: step >= s ? '#0F172A' : 'var(--text-dim)',
                border: step === s ? '2px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: step >= s ? '0 0 15px var(--primary-glow)' : 'none'
              }}>
                {step > s ? <CheckCircle2 size={20} /> : s}
              </div>
              {s < 3 && <div style={{ width: '40px', height: '2px', background: step > s ? 'var(--primary)' : 'rgba(255,255,255,0.05)', margin: '0 6px', borderRadius: '2px' }}></div>}
            </div>
          ))}
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

        {step === 2 && testingOtp && (
          <div className="info-msg animate-fade-in" style={{ 
            background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '14px', 
            borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', 
            textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem'
          }}>
            <strong>Testing Node:</strong> Bypass is <code style={{ fontSize: '1rem', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px', color: 'var(--primary)', fontWeight: 800 }}>{testingOtp}</code>
          </div>
        )}

        <div className="form-content" style={{ minHeight: '240px' }}>
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="animate-fade-in">
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
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.1rem', borderRadius: '18px', fontSize: '1rem' }} disabled={loading}>
                  {loading ? "Initializing..." : <>Initialize Access <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="animate-fade-in">
              <div className="input-group-light">
                <label>6-Digit Security Code</label>
                <span className="input-icon"><Key size={20} /></span>
                <input 
                  type="text" 
                  placeholder="000 000" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-icon glass-bright" style={{ width: '54px', height: '54px', borderRadius: '16px', color: 'var(--text-dim)' }} onClick={() => setStep(1)}>
                  <ArrowRight size={22} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.1rem', borderRadius: '18px', fontSize: '1rem' }} disabled={loading}>
                    {loading ? "Decrypting..." : "Verify Intelligence"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteProfile} className="animate-fade-in">
              <div className="input-group-light">
                <label>Operative Full Name</label>
                <span className="input-icon"><User size={20} /></span>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required 
                />
              </div>
              <div className="input-group-light">
                <label>Auth Email Address</label>
                <span className="input-icon"><Mail size={20} /></span>
                <input 
                  type="email" 
                  placeholder="operative@geosure.com" 
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required 
                />
              </div>
              <div className="input-group-light" style={{ marginBottom: '2.5rem' }}>
                <label>Console Encryption Key</label>
                <span className="input-icon"><Lock size={20} /></span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={profile.password}
                  onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                  minLength={6}
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '18px', fontSize: '1rem', fontWeight: 800 }} disabled={loading}>
                  {loading ? "Encrypting..." : "Finalize Intelligence Connection"}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Existing operative?{" "}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'none', marginLeft: '4px' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
