import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.password) return setError('All fields required.');
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-grid-overlay" />
      <div className="auth-box">
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <span className="auth-logo-text">EMS</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your workspace</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email" name="email" placeholder="you@company.com"
            value={form.email} onChange={handle}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password" name="password" placeholder="••••••••"
            value={form.password} onChange={handle}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Sign In'}
        </button>

        <p className="auth-link">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
