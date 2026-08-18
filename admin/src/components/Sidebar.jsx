import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const links = [
  { to: '/dashboard',              label: 'Overview',     icon: '📊' },
  { to: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { to: '/dashboard/doctors',      label: 'Doctors',      icon: '👨‍⚕️' },
  { to: '/dashboard/users',        label: 'Users',        icon: '👥' },
];

export default function Sidebar() {
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  return (
    <aside style={{
      width: '210px', minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      color: '#111', display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '20px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '32px', height: '32px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🏥</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111', fontFamily: "'Segoe UI', sans-serif" }}>MediCare</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Admin Panel</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '9px 12px', color: isActive ? '#7c3aed' : '#6b7280',
              textDecoration: 'none', fontSize: '13px', fontFamily: "'Segoe UI', sans-serif",
              fontWeight: isActive ? 600 : 400,
              background: isActive ? '#f5f3ff' : 'transparent',
              borderRadius: '8px', marginBottom: '2px',
              borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
            })}>
            <span>{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '12px 8px', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={() => { adminLogout(); navigate('/'); }}
          style={{
            width: '100%', padding: '9px 12px',
            background: '#fff1f2', color: '#be123c',
            border: '1px solid #fecdd3',
            borderRadius: '8px', fontSize: '13px',
            fontFamily: "'Segoe UI', sans-serif",
            cursor: 'pointer', fontWeight: 600,
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
