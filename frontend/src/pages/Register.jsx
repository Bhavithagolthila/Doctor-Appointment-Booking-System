import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

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

const wrapStyle = (hasErr) => ({
  display: 'flex', alignItems: 'center',
  border: `1.5px solid ${hasErr ? '#ef4444' : '#e5e7eb'}`,
  borderRadius: '10px', overflow: 'hidden', background: '#fff',
  transition: 'border-color 0.2s',
});

const inputStyle = {
  flex: 1, padding: '10px 14px', fontSize: '14px', border: 'none',
  fontFamily: 'system-ui', outline: 'none', background: 'transparent', color: '#111',
};

// Password requirements, checked individually so the UI can show a live
// checklist (spec #5) rather than just a pass/fail strength bar.
const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: p => p.length >= 8 },
  { key: 'upper',  label: 'One uppercase letter',   test: p => /[A-Z]/.test(p) },
  { key: 'lower',  label: 'One lowercase letter',   test: p => /[a-z]/.test(p) },
  { key: 'number', label: 'One number',             test: p => /[0-9]/.test(p) },
  { key: 'special',label: 'One special character',  test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pwd) {
  if (!pwd) return 0;
  return PASSWORD_RULES.filter(r => r.test(pwd)).length;
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

// FIX: previously accepted any 10-digit phone number and any 6+ char
// password — neither matched what the backend now actually enforces. This
// mirrors the backend's rules exactly (see backend/utils/validators.js) so
// the user sees the same error here that a raw API call would get, instead
// of frontend validation silently passing something the backend rejects.
function validateField(key, value, form) {
  switch (key) {
    case 'name':    return !value.trim() || value.trim().length < 2 ? 'Enter your full name (min 2 chars)' : '';
    case 'email':   return !value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Enter a valid email' : '';
    case 'phone':   return !value.trim() || !/^[6-9]\d{9}$/.test(value.trim()) ? 'Enter a valid 10-digit Indian mobile number (starts with 6-9)' : '';
    case 'password': {
      if (!value) return 'Password is required';
      const failed = PASSWORD_RULES.filter(r => !r.test(value));
      return failed.length ? `Missing: ${failed.map(r => r.label.toLowerCase()).join(', ')}` : '';
    }
    case 'confirm': return !value ? 'Please confirm your password' : value !== form.password ? 'Passwords do not match' : '';
    default: return '';
  }
}

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate  = useNavigate();

  const strength = getStrength(form.password);

  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
    if (touched[key]) {
      const err = validateField(key, val, { ...form, [key]: val });
      setErrors(prev => ({ ...prev, [key]: err }));
      // re-validate confirm if password changed
      if (key === 'password' && touched.confirm) {
        const cfmErr = form.confirm !== val ? 'Passwords do not match' : '';
        setErrors(prev => ({ ...prev, confirm: cfmErr }));
      }
    }
  };

  const handleBlur = (key) => () => {
    setTouched(prev => ({ ...prev, [key]: true }));
    const err = validateField(key, form[key], form);
    setErrors(prev => ({ ...prev, [key]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const keys = ['name', 'email', 'phone', 'password', 'confirm'];
    const newErrors = {};
    keys.forEach(k => { newErrors[k] = validateField(k, form[k], form); });
    setErrors(newErrors);
    setTouched({ name:true, email:true, phone:true, password:true, confirm:true });
    if (Object.values(newErrors).some(Boolean)) return;
    setApiError(''); setLoading(true);
    try {
      // NOTE: registration must NOT auto-authenticate the user.
      // We deliberately ignore the token/user payload returned here —
      // the user is required to log in explicitly on the next screen.
      await registerUser(form.name.trim(), form.email.trim(), form.password, form.phone.trim(), form.confirm);
      setLoading(false);
      setSuccess(true);
      // Give the user a moment to read the confirmation, then send them to Login.
      setTimeout(() => {
        navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
      }, 1800);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} aria-label={show ? 'Hide password' : 'Show password'}
      style={{ padding:'0 14px', display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', flexShrink:0 }}>
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  const fields = [
    { label:'Full Name',          key:'name',     type:'text',                      prefix:null,  eye:null },
    { label:'Email',              key:'email',    type:'email',                     prefix:null,  eye:null },
    { label:'Phone (10 digits)',  key:'phone',    type:'tel',                       prefix:'+91', eye:null },
    { label:'Password',           key:'password', type: showPwd ? 'text':'password',prefix:null,  eye: eyeBtn(showPwd, () => setShowPwd(p=>!p)) },
    { label:'Confirm Password',   key:'confirm',  type: showCfm ? 'text':'password',prefix:null,  eye: eyeBtn(showCfm, () => setShowCfm(p=>!p)) },
  ];

  // ── Registration successful: show confirmation, then auto-redirect to Login ──
  if (success) {
    return (
      <div style={{ minHeight:'calc(100vh - 64px)', background:'#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:'system-ui' }}>
        <div style={{ background:'#fff', borderRadius:'18px', padding:'48px 36px', width:'100%', maxWidth:'420px', boxShadow:'0 4px 32px rgba(0,0,0,0.09)', textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#dcfce7', color:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 18px' }}>✓</div>
          <h1 style={{ fontSize:'20px', fontWeight:800, margin:'0 0 8px', color:'#111' }}>Registration Successful!</h1>
          <p style={{ fontSize:'14px', color:'#6b7280', margin:'0 0 24px' }}>Please login to continue.</p>
          <Link to="/login" state={{ registered: true, email: form.email.trim() }}
            style={{ display:'inline-block', padding:'12px 28px', background:PRIMARY, color:'#fff', borderRadius:'10px', fontWeight:700, fontSize:'14px', textDecoration:'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#f4f4f8', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:'system-ui' }}>
      <div style={{ background:'#fff', borderRadius:'18px', padding:'40px 36px', width:'100%', maxWidth:'420px', boxShadow:'0 4px 32px rgba(0,0,0,0.09)' }}>

        <h1 style={{ fontSize:'24px', fontWeight:800, margin:'0 0 6px', color:'#111' }}>Create your account</h1>
        <p style={{ fontSize:'13px', color:'#6b7280', margin:'0 0 28px' }}>Book your first appointment in minutes.</p>

        <form onSubmit={handleSubmit} noValidate>
          {fields.map(({ label, key, type, prefix, eye }) => (
            <div key={key} style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>{label}</label>
              <div style={wrapStyle(!!errors[key])}
                onFocus={e => { e.currentTarget.style.borderColor = errors[key] ? '#ef4444' : PRIMARY; }}
                onBlur={e  => { e.currentTarget.style.borderColor = errors[key] ? '#ef4444' : '#e5e7eb'; }}
              >
                {prefix && <span style={{ padding:'10px 10px 10px 14px', fontSize:'14px', color:'#6b7280', background:'#f9fafb', borderRight:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>{prefix}</span>}
                <input
                  type={type} value={form[key]} onChange={handleChange(key)} onBlur={handleBlur(key)}
                  maxLength={key === 'phone' ? 10 : undefined}
                  inputMode={key === 'phone' ? 'numeric' : undefined}
                  style={inputStyle}
                />
                {eye}
              </div>

              {/* Password strength bar + live requirements checklist — spec #5 */}
              {key === 'password' && form.password && (
                <div style={{ marginTop:'8px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ flex:1, height:'4px', borderRadius:'100px', background: i <= strength ? STRENGTH_COLORS[strength] : '#e5e7eb', transition:'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize:'11px', fontWeight:600, color: STRENGTH_COLORS[strength], marginBottom:'6px' }}>{STRENGTH_LABELS[strength]}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                    {PASSWORD_RULES.map(r => {
                      const ok = r.test(form.password);
                      return (
                        <div key={r.key} style={{ fontSize:'11px', color: ok ? '#16a34a' : '#9ca3af', display:'flex', alignItems:'center', gap:'5px' }}>
                          <span>{ok ? '✓' : '○'}</span> {r.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {key === 'password' && !form.password && (
                <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
                  {PASSWORD_RULES.map(r => (
                    <div key={r.key} style={{ fontSize:'11px', color:'#9ca3af', display:'flex', alignItems:'center', gap:'5px' }}>
                      <span>○</span> {r.label}
                    </div>
                  ))}
                </div>
              )}

              {errors[key] && (
                <p style={{ color:'#ef4444', fontSize:'12px', margin:'4px 0 0', display:'flex', alignItems:'center', gap:'4px' }}>
                  <span>⚠️</span> {errors[key]}
                </p>
              )}
              {touched[key] && !errors[key] && form[key] && (
                <p style={{ color:'#22c55e', fontSize:'12px', margin:'4px 0 0', display:'flex', alignItems:'center', gap:'4px' }}>
                  <span>✅</span> Looks good!
                </p>
              )}
            </div>
          ))}

          {apiError && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#dc2626', marginBottom:'16px' }}>
              ⚠️ {apiError}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:PRIMARY, color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor: loading ? 'not-allowed':'pointer', fontFamily:'system-ui', opacity: loading ? 0.75:1, marginTop:'4px' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize:'13px', textAlign:'center', marginTop:'20px', color:'#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:PRIMARY, fontWeight:700, textDecoration:'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
