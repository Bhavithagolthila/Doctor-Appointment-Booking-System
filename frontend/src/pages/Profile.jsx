import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';

const PRIMARY = '#7c3aed';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    // FIX: previously only checked the name wasn't empty — phone had no
    // client-side format check at all, so a typo wasn't caught until the
    // backend rejected it. This mirrors the backend's Indian-mobile rule
    // (see backend/utils/validators.js) so the same input is accepted or
    // rejected consistently on both sides.
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number, or leave it blank.');
      return;
    }
    setSaving(true); setError(''); setSaved(false);
    try {
      // FIX: this now actually persists to the database via PATCH /api/auth/me
      // instead of writing to an unused localStorage key.
      const updated = await updateProfile(name.trim(), phone.trim());
      updateUser({ name: updated.name, phone: updated.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'system-ui', boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f4f4f8', padding: '40px 24px', fontFamily: 'system-ui' }}>
      <div style={{ background: '#fff', borderRadius: '18px', padding: '40px 36px', width: '100%', maxWidth: '460px', margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#111' }}>Your Profile</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 28px' }}>Update your account details.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit phone number" maxLength={10} inputMode="numeric" style={inputStyle}
              onFocus={e => e.target.style.borderColor = PRIMARY}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: '#374151' }}>Email</label>
            <input type="email" value={user.email} disabled style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }} />
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0' }}>Email cannot be changed.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
              ✅ Profile updated successfully.
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            padding: '12px 28px', background: PRIMARY, color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '14px',
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'system-ui', alignSelf: 'flex-start', opacity: saving ? 0.75 : 1,
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
