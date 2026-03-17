import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

    // Basic validation
    if (!/^\d{10,15}$/.test(whatsappNumber)) {
      setError("Please enter a valid WhatsApp number (at least 10 digits)");
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
    <div className="auth-page bg-dark-gradient">
      <div className="auth-card glass animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">🚀</div>
          <h2>Welcome Back</h2>
          <p>Login to your GPS dashboard</p>
        </div>

        {error && (
          <div className="error-msg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          {/* WhatsApp Number */}
          <div className="input-group">
            <span className="input-icon">📱</span>
            <input
              type="text"
              placeholder="WhatsApp Number (e.g. 91XXXXXXXXXX)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '3rem' }}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-btn"
          >
            {loading ? (
              <>
                <span className="loader-small"></span>
                Logging in...
              </>
            ) : "Login"}
          </button>
        </form>

        <div className="auth-footer mt-6">
          <p>
            New user?{" "}
            <Link to="/register" className="highlight-link">
              Register here
            </Link>
          </p>
          <div className="forgot-password-link mt-2">
            <a href="#" className="muted-link">Forgot Password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
