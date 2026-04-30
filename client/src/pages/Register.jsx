import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import './Auth.css';

export default function Register() {
  const [form,    setForm]    = useState({ email: '', password: '', confirm: '' });
  const [errors,  setErrors]  = useState({});
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const navigate = useNavigate();

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const e = {};
    if (!form.email)   e.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setLoading(true); setError('');
    try {
      await API.post('/auth/register', { email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err.userMessage || 'Registration failed. Please try again.');
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
        <p className="auth-sub">Join your workspace</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>Email</label>
          <input
            type="email" name="email" placeholder="you@company.com"
            value={form.email} onChange={handle}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label>Password</label>
          <div className="input-wrap">
            <input
              type={showPw ? 'text' : 'password'} name="password" placeholder="••••••••"
              value={form.password} onChange={handle}
              className={errors.password ? 'input-error' : ''}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="auth-field">
          <label>Confirm Password</label>
          <input
            type="password" name="confirm" placeholder="••••••••"
            value={form.confirm} onChange={handle}
            className={errors.confirm ? 'input-error' : ''}
          />
          {errors.confirm && <span className="field-error">{errors.confirm}</span>}
        </div>

        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Create Account'}
        </button>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}