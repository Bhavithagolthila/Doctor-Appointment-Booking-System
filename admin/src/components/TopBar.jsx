import { useAdminAuth } from '../context/AdminAuthContext';

export default function TopBar({ title }) {
  const { adminUser } = useAdminAuth();

  return (
    <header style={{
      height: '60px', background: '#fff',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: "'Segoe UI', sans-serif" }}>
        {title}
      </h2>
      {adminUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '12px', fontWeight: 700,
          }}>
            {adminUser.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{adminUser.name || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Administrator</div>
          </div>
        </div>
      )}
    </header>
  );
}
