import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.password) return setError('All fields required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); setError('');
    try {
      await API.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Get started with EMS</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email" name="email" placeholder="you@company.com"
            value={form.email} onChange={handle}
          />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password" name="password" placeholder="Min. 6 characters"
            value={form.password} onChange={handle}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Create Account'}
        </button>

        <p className="auth-link">
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
