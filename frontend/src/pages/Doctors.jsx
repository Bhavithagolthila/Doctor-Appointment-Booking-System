import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllDoctors } from '../api/doctors';
import DoctorCard from '../components/DoctorCard';

const PRIMARY = '#7c3aed';
const SPECIALITIES = ['All', 'General Physician', 'Gynecologist', 'Dermatologist', 'Pediatricians', 'Neurologist', 'Gastroenterologist'];

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [speciality, setSpeciality] = useState(searchParams.get('speciality') || 'All');
  const [availability, setAvailability] = useState('All');
  // FIX: the Home page search bar links to /doctors?search=..., but this
  // page was never reading that query param, so a search from Home always
  // landed on an unfiltered list. Now seeded from the URL on first load.
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // ── FIX 4: proper loading + error states ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAllDoctors()
      .then(setDoctors)
      .catch(() => setError('Could not load doctors. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(d => {
    const matchSpec = speciality === 'All' || d.speciality === speciality;
    const matchAvail = availability === 'All' ? true : availability === 'Available' ? d.available : !d.available;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.speciality.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchAvail && matchSearch;
  });

  return (
    <div style={{ fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .doctors-header { padding: 28px 16px 48px !important; }
          .doctors-filter { padding: 12px 14px !important; }
          .doctors-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .doctors-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div className="doctors-header" style={{ background: PRIMARY, color: '#fff', padding: '40px 32px 60px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, fontFamily: 'Georgia, serif' }}>Find a Doctor</h1>
        <p style={{ margin: '0 0 24px', opacity: 0.85, fontSize: '15px' }}>
          Browse from {loading ? '…' : `${doctors.length}+`} specialists across all fields
        </p>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
          <input
            placeholder="Search by name or speciality..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '13px 16px 13px 42px',
              border: 'none', borderRadius: '12px', fontSize: '14px',
              fontFamily: 'system-ui', outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-24px auto 0', padding: '0 24px 60px', position: 'relative' }}>
        {/* Filter bar */}
        <div className="doctors-filter" style={{
          background: '#fff', borderRadius: '16px', padding: '16px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '28px',
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            {SPECIALITIES.map(s => (
              <button key={s} onClick={() => setSpeciality(s)} style={{
                padding: '6px 14px',
                background: speciality === s ? PRIMARY : '#f3f4f6',
                color: speciality === s ? '#fff' : '#374151',
                border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>{s}</button>
            ))}
          </div>
          <select value={availability} onChange={e => setAvailability(e.target.value)} style={{
            padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
            fontSize: '13px', fontFamily: 'system-ui', cursor: 'pointer', background: '#fff', outline: 'none',
          }}>
            {['All', 'Available', 'Unavailable'].map(a => <option key={a}>{a}</option>)}
          </select>
          {!loading && !error && (
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── FIX 4: loading skeleton ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ height: '160px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                <div style={{ padding: '14px' }}>
                  <div style={{ height: '14px', background: '#f0f0f0', borderRadius: '6px', marginBottom: '8px' }} />
                  <div style={{ height: '11px', background: '#f0f0f0', borderRadius: '6px', width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FIX 4: error state with retry ── */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: '20px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontWeight: 700, margin: '0 0 8px', color: '#111' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>{error}</p>
            <button
              onClick={() => { setLoading(true); setError(''); getAllDoctors().then(setDoctors).catch(() => setError('Still failing. Is the backend running?')).finally(() => setLoading(false)); }}
              style={{ padding: '12px 28px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="doctors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px' }}>
            {filtered.map(doc => <DoctorCard key={doc._id || doc.id} doctor={doc} />)}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && doctors.length > 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>
            No doctors match your search. Try different filters.
          </div>
        )}
      </div>

      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}
