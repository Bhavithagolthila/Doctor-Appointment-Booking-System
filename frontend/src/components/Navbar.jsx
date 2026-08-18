import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PRIMARY = '#7c3aed';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '60px',
      borderBottom: '1px solid #e5e7eb',
      background: '#fff', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-auth { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-menu { display: flex !important; }
        }
      `}</style>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <div style={{
          width: '32px', height: '32px', background: PRIMARY, borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
        }}>🏥</div>
        <span style={{ fontWeight: 700, fontSize: '17px', color: '#111', fontFamily: "'Segoe UI', sans-serif" }}>
          MediCare
        </span>
      </Link>

      {/* Desktop Links */}
      <div className="nav-links" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[['/', 'Home'], ['/doctors', 'Doctors'], ['/about', 'About'], ['/contact', 'Contact']].map(([path, label]) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              padding: '6px 13px',
              color: isActive ? PRIMARY : '#4b5563',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              fontFamily: "'Segoe UI', sans-serif",
              borderRadius: '6px',
              background: isActive ? '#f5f3ff' : 'transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Hamburger button - mobile only */}
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(o => !o)}
        style={{
          display: 'none', background: 'none', border: '1px solid #e5e7eb',
          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
          flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#374151', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#374151', borderRadius: '2px', opacity: menuOpen ? 0 : 1 }} />
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#374151', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{
          display: 'none', position: 'absolute', top: '60px', left: 0, right: 0,
          background: '#fff', borderBottom: '1px solid #e5e7eb', flexDirection: 'column',
          padding: '12px 16px', gap: '4px', zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {[['/', 'Home'], ['/doctors', 'Doctors'], ['/about', 'About'], ['/contact', 'Contact'],
            ...(isLoggedIn ? [['/my-appointments', 'My Appointments'], ['/profile', 'Profile']] : [])
          ].map(([path, label]) => (
            <NavLink key={path} to={path} end={path === '/'}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '10px 14px', color: isActive ? PRIMARY : '#374151',
                textDecoration: 'none', fontSize: '14px', fontWeight: isActive ? 600 : 400,
                borderRadius: '8px', background: isActive ? '#f5f3ff' : 'transparent',
              })}
            >{label}</NavLink>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '8px', paddingTop: '8px' }}>
            {isLoggedIn ? (
              <button onClick={handleLogout} style={{
                width: '100%', padding: '10px 14px', background: '#fef2f2', color: '#dc2626',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}>Logout</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, padding: '10px', border: '1px solid #e5e7eb', background: '#fff',
                  textDecoration: 'none', fontSize: '13px', borderRadius: '8px', color: '#374151',
                  textAlign: 'center', fontWeight: 500,
                }}>Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, padding: '10px', background: PRIMARY,
                  textDecoration: 'none', fontSize: '13px', borderRadius: '8px', color: '#fff',
                  textAlign: 'center', fontWeight: 600,
                }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            <NavLink to="/my-appointments" style={({ isActive }) => ({
              padding: '6px 13px', color: isActive ? '#7c3aed' : '#4b5563',
              textDecoration: 'none', fontSize: '14px', fontFamily: "'Segoe UI', sans-serif",
              background: isActive ? '#f5f3ff' : 'transparent', borderRadius: '6px',
            })}>
              Appointments
            </NavLink>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '4px 10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{
                width: '26px', height: '26px', background: '#7c3aed', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '11px', fontWeight: 700,
              }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <NavLink to="/profile" style={{ color: '#374151', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                {user.name?.split(' ')[0]}
              </NavLink>
            </div>
            <button onClick={handleLogout} style={{
              padding: '7px 14px', border: '1px solid #e5e7eb', background: '#fff',
              cursor: 'pointer', fontSize: '13px', borderRadius: '7px', fontFamily: "'Segoe UI', sans-serif",
              fontWeight: 500, color: '#374151',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              padding: '7px 16px', border: '1px solid #e5e7eb', background: '#fff',
              textDecoration: 'none', fontSize: '13px', borderRadius: '7px', color: '#374151',
              fontFamily: "'Segoe UI', sans-serif", fontWeight: 500,
            }}>
              Login
            </Link>
            <Link to="/register" style={{
              padding: '7px 16px', background: '#7c3aed', border: '1px solid #7c3aed',
              textDecoration: 'none', fontSize: '13px', borderRadius: '7px', color: '#fff',
              fontFamily: "'Segoe UI', sans-serif", fontWeight: 600,
            }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
