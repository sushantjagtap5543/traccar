import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginUser(email, password);
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">📡</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your Traccar account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}
          
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>

    </div>
  );
}
