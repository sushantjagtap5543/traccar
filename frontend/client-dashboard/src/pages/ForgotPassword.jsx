import { useState } from "react";
import { requestPasswordReset, confirmPasswordReset } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

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
      setError("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
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
      setSuccess("Your password has been reset successfully!");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page bg-dark-gradient">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">{step === 3 ? "✅" : "🔐"}</div>
          <h2>{step === 3 ? "Password Reset" : "Reset Password"}</h2>
          <p>
            {step === 1 && "Recover access to your account"}
            {step === 2 && `Enter the code sent to ${whatsappNumber}`}
            {step === 3 && success}
          </p>
        </div>

        {error && (
          <div className="error-msg mb-4">
            {error}
          </div>
        )}

        {step === 2 && testingOtp && (
          <div className="info-msg mb-4" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center' }}>
            <strong>[TESTING]</strong> Your Reset OTP is: <code style={{ fontSize: '1.2rem', marginLeft: '5px' }}>{testingOtp}</code>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="auth-form">
            <div className="input-group">
              <span className="input-icon">📱</span>
              <input 
                type="text" 
                placeholder="Registered 10-digit WhatsApp Number" 
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
                    Sending Code...
                  </>
                ) : "Send Reset Code"}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="muted-link">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-group">
              <span className="input-icon">🔑</span>
              <input 
                type="text" 
                placeholder="6-digit Reset Code" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                required 
              />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loader-small"></span>
                    Resetting...
                  </>
                ) : "Set New Password"}
            </button>
            <div className="text-center mt-4">
              <button type="button" className="muted-link" onClick={() => { setStep(1); setTestingOtp(""); }}>
                Change Number
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center mt-6">
            <Link to="/login" className="btn-primary auth-btn block text-center" style={{ textDecoration: 'none' }}>
              Login with New Password
            </Link>
          </div>
        )}

        {step !== 3 && (
          <div className="auth-footer mt-6">
            <p>
              Remember your password?{" "}
              <Link to="/login" className="highlight-link">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
