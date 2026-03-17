import { useState } from "react";
import { requestOtp, verifyOtp, completeProfile } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Profile
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
      setError("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
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
      setError(err.response?.data?.message || err.message || "Failed to send OTP. Please try again.");
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
      setError(err.response?.data?.message || err.message || "Invalid OTP. Please try again.");
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page bg-dark-gradient">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">📡</div>
          <h2>{step === 3 ? "Complete Profile" : "Create Account"}</h2>
          <p>
            {step === 1 && "Join the enterprise tracking platform"}
            {step === 2 && `Enter the 6-digit code sent to ${whatsappNumber}`}
            {step === 3 && "Finalize your account details"}
          </p>
        </div>

        <div className="steps-indicator mb-6">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {error && (
          <div className="error-msg mb-4">
            {error}
          </div>
        )}

        {step === 2 && testingOtp && (
          <div className="info-msg mb-4" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center' }}>
            <strong>[TESTING]</strong> Your OTP is: <code style={{ fontSize: '1.2rem', marginLeft: '5px' }}>{testingOtp}</code>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="input-group">
              <span className="input-icon">📱</span>
              <input 
                type="text" 
                placeholder="WhatsApp Number (e.g. 9876543210)" 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader-small"></span>
                    Sending OTP...
                  </>
                ) : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="input-group">
              <span className="input-icon">🔑</span>
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader-small"></span>
                    Verifying...
                  </>
                ) : "Verify OTP"}
            </button>
            <div className="text-center mt-4">
              <button type="button" className="muted-link" onClick={() => { setStep(1); setTestingOtp(""); }}>
                Change Number
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCompleteProfile} className="auth-form">
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required 
              />
            </div>
            <div className="input-group">
              <span className="input-icon">📧</span>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required 
              />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input 
                type="password" 
                placeholder="Set Password" 
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader-small"></span>
                    Completing registration...
                  </>
                ) : "Complete Registration"}
            </button>
          </form>
        )}

        <div className="auth-footer mt-6">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="highlight-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
