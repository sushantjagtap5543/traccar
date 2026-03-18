import { useState } from "react";
import { requestPasswordReset, confirmPasswordReset } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Phone, Key, Lock, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP & New Password, 3: Success
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [testingOtp, setTestingOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[6789]\d{9}$/.test(whatsappNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(whatsappNumber);
      if (data.testingOtp) {
        setTestingOtp(data.testingOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(whatsappNumber, otp, newPassword);
      setStep(3);
      setSuccess("Intelligence Access Restored");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-light">
      <div className="auth-card-light animate-fade-in" style={{ maxWidth: step === 3 ? '480px' : '520px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'
          }}>
             {step === 3 ? (
                <CheckCircle2 size={42} color="var(--success)" />
             ) : (
                <ShieldCheck size={42} color="var(--primary)" />
             )}
          </div>
          <h2 style={{ fontSize: '2.25rem', color: 'white', fontWeight: 900, letterSpacing: '-1px' }}>
            {step === 3 ? "Reset Complete" : "Reset Access"}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.25rem' }}>
            {step === 1 && "Recover your secure intelligence credentials"}
            {step === 2 && `Enter the security code sent to +91 ${whatsappNumber}`}
            {step === 3 && success}
          </p>
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
            <strong>Testing Node:</strong> Reset OTP is <code style={{ fontSize: '1.1rem', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px', color: 'var(--primary)', fontWeight: 800 }}>{testingOtp}</code>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="input-group-light" style={{ marginBottom: '2.5rem' }}>
              <label>Registered WhatsApp Number</label>
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
              {loading ? "Initializing..." : <>Request Reset Code <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-group-light">
              <label>Security Code</label>
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
            <div className="input-group-light" style={{ marginBottom: '2.5rem' }}>
              <label>New Console Password</label>
              <span className="input-icon"><Lock size={20} /></span>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-icon glass-bright" style={{ width: '54px', height: '54px', borderRadius: '16px', color: 'var(--text-dim)' }} onClick={() => setStep(1)}>
                  <ArrowRight size={22} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.1rem', borderRadius: '18px', fontSize: '1rem' }} disabled={loading}>
                    {loading ? "Updating..." : "Establish New Access"}
                </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
             <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Authentication tokens have been re-encrypted. You can now establish a new secure session.</p>
                <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', width: '100%', padding: '1.1rem', borderRadius: '18px' }}>
                    Continue to Login
                </Link>
             </div>
          </div>
        )}

        {step !== 3 && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/login" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textDecoration: 'none', opacity: 0.8 }}>
                Back to Session Login
              </Link>
            </div>
        )}
      </div>
    </div>
  );
}

