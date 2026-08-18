import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const PRIMARY = '#7c3aed';

// Clean, consistent SVG icons instead of emoji (emoji render inconsistently across OS/fonts).
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// FIX: login previously re-validated password strength with its own rule
// (min 6 chars) that didn't match — and was weaker than — the actual
// backend/registration rule (8+ chars, upper/lower/number/special char).
// Login isn't the place to enforce password strength at all: the account
// already exists with whatever password was set at registration, so the
// only thing worth checking here is that something was typed. See
// backend/utils/validators.js for the real rule, enforced at registration.
function validateField(key, value) {
  switch (key) {
    case 'email':    return !value.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Enter a valid email' : '';
    case 'password': return !value ? 'Password is required' : '';
    default: return '';
  }
}

export default function Login() {
  const [form, setForm]       = useState({ email:'', password:'' });
  const [registeredMsg, setRegisteredMsg] = useState(false);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Arrived here right after a successful registration — show confirmation + prefill email.
  useEffect(() => {
    if (location.state?.registered) {
      setRegisteredMsg(true);
      if (location.state?.email) setForm(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
    if (touched[key]) setErrors(prev => ({ ...prev, [key]: validateField(key, val) }));
  };

  const handleBlur = (key) => () => {
    setTouched(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: validateField(key, form[key]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { email: validateField('email', form.email), password: validateField('password', form.password) };
    setErrors(newErrors);
    setTouched({ email:true, password:true });
    if (Object.values(newErrors).some(Boolean)) return;
    setApiError(''); setLoading(true);
    try {
      const userData = await loginUser(form.email, form.password);
      login(userData);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const fieldBorder = (key) => errors[key] ? '#ef4444' : (touched[key] && form[key] ? '#22c55e' : '#e5e7eb');

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:'system-ui' }}>
      <div style={{ background:'#fff', borderRadius:'18px', padding:'40px 36px', width:'100%', maxWidth:'420px', boxShadow:'0 4px 32px rgba(0,0,0,0.09)' }}>

        <h1 style={{ fontSize:'24px', fontWeight:800, margin:'0 0 6px', color:'#111' }}>Welcome back</h1>
        <p style={{ fontSize:'13px', color:'#6b7280', margin:'0 0 20px' }}>Login to book and manage appointments.</p>

        {registeredMsg && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#16a34a', marginBottom:'18px', fontWeight:600 }}>
            ✅ Registration Successful! Please login to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={{ marginBottom:'18px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Email</label>
            <input
              type="email" value={form.email}
              onChange={handleChange('email')} onBlur={handleBlur('email')}
              placeholder="you@example.com"
              style={{ width:'100%', padding:'10px 14px', fontSize:'14px', border:`1.5px solid ${fieldBorder('email')}`, borderRadius:'10px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
              onFocus={e => { if (!errors.email) e.target.style.borderColor = PRIMARY; }}
            />
            {errors.email && <p style={{ color:'#ef4444', fontSize:'12px', margin:'4px 0 0', display:'flex', alignItems:'center', gap:'4px' }}>⚠️ {errors.email}</p>}
            {touched.email && !errors.email && form.email && <p style={{ color:'#22c55e', fontSize:'12px', margin:'4px 0 0' }}>✅ Looks good!</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom:'18px' }}>
            <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>Password</label>
            <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${fieldBorder('password')}`, borderRadius:'10px', overflow:'hidden', transition:'border-color 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : PRIMARY; }}
              onBlur={e  => { e.currentTarget.style.borderColor = fieldBorder('password'); }}
            >
              <input
                type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={handleChange('password')} onBlur={handleBlur('password')}
                placeholder="Enter your password"
                style={{ flex:1, padding:'10px 14px', fontSize:'14px', border:'none', fontFamily:'system-ui', outline:'none', background:'transparent', color:'#111' }}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} aria-label={showPwd ? 'Hide password' : 'Show password'}
                style={{ padding:'0 14px', display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', flexShrink:0 }}>
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p style={{ color:'#ef4444', fontSize:'12px', margin:'4px 0 0' }}>⚠️ {errors.password}</p>}
            {touched.password && !errors.password && form.password && <p style={{ color:'#22c55e', fontSize:'12px', margin:'4px 0 0' }}>✅ Looks good!</p>}
          </div>

          {apiError && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#dc2626', marginBottom:'16px' }}>
              ⚠️ {apiError}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:PRIMARY, color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor: loading ? 'not-allowed':'pointer', fontFamily:'system-ui', opacity: loading ? 0.75:1 }}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p style={{ fontSize:'13px', textAlign:'center', marginTop:'20px', color:'#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:PRIMARY, fontWeight:700, textDecoration:'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
