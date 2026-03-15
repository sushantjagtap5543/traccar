import { useState } from "react";
import { register } from "../services/authService";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(data.name, data.email, data.password);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">📡</div>
          <h2>Create Account</h2>
          <p>Join the enterprise tracking platform</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-msg">{error}</div>}
          
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Full Name" 
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              required 
            />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              required 
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              required 
            />
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={20} /> Sign Up</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

    </div>
  );
}
