import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/admin';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin: login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const data = await adminLogin(email, password);
      login(data.token, { id: data.id, name: data.name, email: data.email });
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Invalid credentials. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #1e1033 0%, #2d1b69 50%, #1e1033 100%)', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)' }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(124,58,237,0.08)' }} />
      <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #7c3aed, #7c3aed)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🏥</div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif' }}>MediCare Admin</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Sign in to your admin panel</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['Email', 'email', email, setEmail, 'admin@medicare.com'], ['Password', 'password', password, setPass, '••••••••']].map(([label, type, val, set, ph]) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'system-ui', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          ))}
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: '13px', background: loading ? '#a78bfa' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
