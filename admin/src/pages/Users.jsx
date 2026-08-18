import { useState, useEffect } from 'react';
import { getAllUsers, updateUserStatus } from '../api/admin';

const PRIMARY = '#7c3aed';

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  // FIX: the backend already supported PATCH /api/admin/users/:id/status
  // and the API wrapper (updateUserStatus) already existed, but this page
  // only displayed the Active/Inactive badge with no way to change it.
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    getAllUsers().then(setUsers).catch(console.error);
  }, []);

  const handleToggleActive = async (u) => {
    const nextActive = !(u.active !== false);
    setToggling(u._id);
    try {
      const updated = await updateUserStatus(u._id, nextActive);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, active: updated.active } : x));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user status');
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = name => name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const COLORS = ['#ede9fe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5'];
  const TEXT_COLORS = ['#6d28d9', '#15803d', '#d97706', '#be185d', '#7c3aed', '#c2410c'];

  return (
    <div style={{ padding: '28px', fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, fontFamily: 'Georgia, serif', color: '#0f172a' }}>
          Users
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          {users.length} registered user{users.length !== 1 ? 's' : ''}
          {' · '}{users.filter(u => u.active !== false).length} active
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
        <input
          placeholder="Search users..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 34px',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            fontSize: '13px', fontFamily: 'system-ui', background: '#fff',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>
          No users found.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['User', 'Email', 'Joined', 'Appointments', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      borderBottom: '1px solid #f1f5f9',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const isActive = u.active !== false;
                  return (
                    <tr key={u._id}
                      style={{ borderBottom: '1px solid #f8fafc', opacity: isActive ? 1 : 0.6 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                            background: COLORS[i % COLORS.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 800, color: TEXT_COLORS[i % TEXT_COLORS.length],
                          }}>
                            {getInitials(u.name)}
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', color: '#374151', fontSize: '12px', fontFamily: 'monospace' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#f5f3ff', color: '#7c3aed',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 700,
                        }}>
                          {u.appointmentCount ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                          background: isActive ? '#dcfce7' : '#f3f4f6',
                          color: isActive ? '#16a34a' : '#9ca3af',
                        }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={toggling === u._id}
                          style={{
                            padding: '5px 12px',
                            background: isActive ? '#fef2f2' : '#f0fdf4',
                            color: isActive ? '#dc2626' : '#16a34a',
                            border: `1px solid ${isActive ? '#fecaca' : '#bbf7d0'}`,
                            borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                            cursor: toggling === u._id ? 'not-allowed' : 'pointer',
                            opacity: toggling === u._id ? 0.6 : 1,
                          }}
                        >
                          {toggling === u._id ? '…' : isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
