import { useState } from "react";
import { requestOtp, verifyOtp, completeProfile } from "../services/authService";
import { UserPlus, Mail, Lock, Smartphone, Key, Loader2, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Profile
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestOtp(mobile);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please check the mobile number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyOtp(mobile, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await completeProfile(profile.name, profile.email, profile.password);
      alert("Registration successful! Welcome to the platform.");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">📡</div>
          <h2>{step === 3 ? "Complete Profile" : "Create Account"}</h2>
          <p>
            {step === 1 && "Join the enterprise tracking platform"}
            {step === 2 && `Enter the 6-digit code sent to ${mobile}`}
            {step === 3 && "Finalize your account details"}
          </p>
        </div>

        <div className="steps-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="input-group">
              <Smartphone className="input-icon" size={20} />
              <input 
                type="tel" 
                placeholder="Mobile Number" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><Smartphone size={20} /> Send OTP</>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="input-group">
              <Key className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Verify OTP</>}
            </button>
            <button type="button" className="btn-link" onClick={() => setStep(1)}>Change Number</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCompleteProfile} className="auth-form">
            <div className="input-group">
              <UserPlus className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required 
              />
            </div>
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required 
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                placeholder="Password" 
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Complete Setup</>}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
