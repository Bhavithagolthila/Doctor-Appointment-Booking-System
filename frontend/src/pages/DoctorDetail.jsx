import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorById, getAllDoctors } from '../api/doctors';
import { useAuth } from '../context/AuthContext';
import SlotPicker from '../components/SlotPicker';
import { resolveImageUrl } from '../utils/imageUrl';

// ── FIX 5: one single source of truth for brand color ──
const PRIMARY = '#7c3aed';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');
  const [relatedDoctors, setRelatedDoctors] = useState([]);

  // ── FIX 4: loading + error states ──
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    setLoading(true);
    setFetchError('');
    setDoctor(null);

    getDoctorById(id)
      .then(doc => {
        setDoctor(doc);
        // FIX: "Related Doctors" used to import the old leftover mock file
        // (frontend/src/data/doctors.js) and filter *that* by specialty —
        // completely unrelated to the real doctor shown above. Since both
        // that mock file and the real seeded data reuse the same image
        // filenames (doc1.png, doc2.png, ...) for different people, it
        // showed the correct photo next to the WRONG name (e.g. the photo
        // used for "Dr. Arjun Sharma" in the real data is labeled
        // "Dr. Richard James" in the mock file). Now pulls from the same
        // real doctor list the rest of the app uses.
        getAllDoctors().then(all => {
          setRelatedDoctors(
            all.filter(d => d.speciality === doc.speciality && String(d._id || d.id) !== String(id)).slice(0, 4)
          );
        }).catch(() => setRelatedDoctors([]));
      })
      .catch(() => setFetchError('Could not load this doctor\'s profile. Please go back and try again.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time.');
      return;
    }
    setError('');
    navigate('/payment', { state: { doctor, date: selectedDate, time: selectedTime, user } });
  };

  // ── FIX 4: loading state ──
  if (loading) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui' }}>
      <div style={{ display: 'inline-block', width: '32px', height: '32px', border: `3px solid #ede9fe`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ marginTop: '16px', fontSize: '14px' }}>Loading doctor profile…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── FIX 4: error state ──
  if (fetchError) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ fontWeight: 700, margin: '0 0 8px', color: '#111' }}>Could not load profile</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>{fetchError}</p>
      <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
        ← Go back
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer',
          fontSize: '14px', fontWeight: 600, padding: '0', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          ← Back
        </button>

        {/* Doctor Profile Card */}
        <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
            {/* Image panel */}
            <div style={{
              width: '260px', flexShrink: 0, background: '#f5f3ff',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              minHeight: '280px', position: 'relative', overflow: 'hidden',
            }}>
              <img
                src={resolveImageUrl(doctor.image)}
                alt={doctor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', position: 'absolute', top: 0, left: 0 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              {doctor.available && (
                <div style={{
                  position: 'absolute', top: '14px', left: '14px',
                  background: '#dcfce7', color: '#16a34a', fontSize: '12px',
                  fontWeight: 700, padding: '5px 12px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  Available
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, padding: '32px', minWidth: '240px' }}>
              <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: '#111' }}>{doctor.name}</h1>
              <p style={{ margin: '0 0 4px', fontSize: '15px', color: PRIMARY, fontWeight: 600 }}>{doctor.speciality}</p>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b7280' }}>{doctor.degree} · {doctor.experience} experience</p>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
                {doctor.about || 'Dedicated healthcare professional committed to providing excellent patient care.'}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f5f3ff', borderRadius: '12px', padding: '12px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: PRIMARY }}>₹{doctor.fee}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Consultation Fee</div>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{doctor.experience}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        {doctor.available ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>Book Your Appointment</h2>
            <SlotPicker
              doctorId={doctor._id || doctor.id}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              selectedTime={selectedTime} setSelectedTime={setSelectedTime}
            />
            <div style={{ marginTop: '20px' }}>
              {error && (
                <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}
              <button onClick={handleBook} style={{
                padding: '14px 32px', background: PRIMARY, color: '#fff',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontSize: '15px', fontWeight: 700, transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = PRIMARY}
              >
                Proceed to Payment →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', color: '#dc2626', fontSize: '14px' }}>
            ⚠️ This doctor is currently not available for booking. Please check back later.
          </div>
        )}

        {/* Related Doctors */}
        {relatedDoctors.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Related Doctors</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {relatedDoctors.map(doc => (
                <div key={doc._id || doc.id} onClick={() => navigate(`/doctors/${doc._id || doc.id}`)} style={{
                  background: '#fff', borderRadius: '14px', overflow: 'hidden',
                  cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  border: '1px solid #f0f0f0', transition: 'transform 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ height: '120px', background: '#f5f3ff', overflow: 'hidden' }}>
                    <img src={resolveImageUrl(doc.image)} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{doc.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{doc.speciality}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
