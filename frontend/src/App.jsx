import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyAppointments from './pages/MyAppointments';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import Footer from './components/Footer';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

/* ───────── ABOUT PAGE ───────── */
function AboutPage() {
  const PRIMARY = '#7c3aed';
  const LIGHT_BG = 'linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%)';

  const pillars = [
    {
      icon: '🩷',
      title: 'Quality Care',
      desc: 'Every doctor is verified and rated by real patients.',
    },
    {
      icon: '🛡️',
      title: 'Trust',
      desc: 'Secure payments, encrypted data, transparent fees.',
    },
    {
      icon: '⚡',
      title: 'Convenience',
      desc: 'Book in 2 minutes, manage everything in one place.',
    },
  ];

  const stats = [
    { value: '6', label: 'Specialities' },
    { value: '12+', label: 'Verified Doctors' },
    { value: '50+', label: 'Cities Covered' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui', color: '#111', background: '#fff' }}>
      {/* Hero banner */}
      <div style={{
        background: LIGHT_BG,
        padding: '72px 24px 60px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, fontFamily: 'Georgia, serif', margin: '0 0 16px' }}>
          About MediCare
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          We're building India's most trusted doctor appointment platform — connecting patients with
          verified specialists, anywhere, anytime.
        </p>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: '860px', margin: '60px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '14px', fontFamily: 'Georgia, serif' }}>Our mission</h2>
        <p style={{ color: '#374151', lineHeight: 1.8, fontSize: '15px', marginBottom: '32px' }}>
          Quality healthcare should be accessible, transparent, and respectful of every patient's time. MediCare exists
          to remove the friction from booking — no phone tag, no waiting, no surprise fees. Just qualified doctors,
          clear pricing in ₹, and a secure way to confirm your appointment.
        </p>

        {/* Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {pillars.map(p => (
            <div key={p.title} style={{
              background: '#fafafa', border: '1px solid #f0f0f0',
              borderRadius: '14px', padding: '24px 20px',
            }}>
              <div style={{
                width: '40px', height: '40px', background: '#f5f3ff',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '14px',
              }}>{p.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{p.title}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {stats.map(s => (
            <div key={s.label} style={{
              border: '1px solid #f0f0f0', borderRadius: '14px',
              padding: '24px 16px', textAlign: 'center', background: '#fff',
            }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: PRIMARY, fontFamily: 'Georgia, serif' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── CONTACT PAGE ───────── */
function ContactPage() {
  const PRIMARY = '#7c3aed';

  const infos = [
    { icon: '📍', label: 'Address', value: '123 Healthcare Avenue, Mumbai 400001' },
    { icon: '📞', label: 'Phone', value: '+91 98765 43210' },
    { icon: '✉️', label: 'Email', value: 'support@medicare.in' },
    { icon: '🕐', label: 'Hours', value: 'Mon-Sat: 9:00 AM - 6:00 PM' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! We\'ll get back to you shortly.');
    e.target.reset();
  };

  return (
    <div style={{ fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Get in touch</h1>
        <p style={{ color: '#6b7280', margin: '0 0 36px', fontSize: '15px' }}>We're here to help — reach out anytime.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            {[
              { label: 'Name', type: 'text', name: 'name' },
              { label: 'Email', type: 'email', name: 'email' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>{f.label}</label>
                <input
                  type={f.type} name={f.name} required
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                    borderRadius: '10px', fontSize: '14px', fontFamily: 'system-ui',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = PRIMARY; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                />
              </div>
            ))}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Message</label>
              <textarea
                name="message" required rows={5}
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'system-ui',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = PRIMARY; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>
            <button type="submit" style={{
              padding: '12px 28px', background: PRIMARY, color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui',
            }}>
              Send message
            </button>
          </form>

          {/* Info cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {infos.map(info => (
              <div key={info.label} style={{
                background: '#fff', borderRadius: '14px', padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{
                  width: '40px', height: '40px', background: '#f5f3ff',
                  borderRadius: '10px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                }}>
                  {info.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{info.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{info.value}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
