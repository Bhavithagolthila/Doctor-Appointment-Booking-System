import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';

const P     = '#6D28D9';
const P2    = '#8B5CF6';
const LIGHT = '#F5F3FF';

export default function DoctorCard({ doctor }) {
  const navigate    = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered,   setHovered]   = useState(false);

  const rawImage = doctor.image || '';
  const imgSrc = resolveImageUrl(rawImage, '');

  const initials = doctor.name
    .split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');

  const goToDoctor = () => {
    if (doctor.available) navigate(`/doctors/${doctor._id || doctor.id}`);
  };

  const rating  = doctor.rating || 4.5;
  const fullStars = Math.round(rating);

  return (
    <div
      onClick={goToDoctor}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: doctor.available ? 'pointer' : 'default',
        border: `1.5px solid ${hovered && doctor.available ? P : '#e5e7eb'}`,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
        boxShadow: hovered && doctor.available ? '0 8px 28px rgba(109,40,217,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered && doctor.available ? 'translateY(-3px)' : 'none',
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Image panel */}
      <div style={{
        height: '190px',
        background: `linear-gradient(135deg, ${LIGHT}, #ede9fe)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!imgFailed && rawImage ? (
          <img
            src={imgSrc}
            alt={doctor.name}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              filter: doctor.available ? 'none' : 'grayscale(60%)',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              mixBlendMode: 'multiply',
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${P}, ${P2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 16px rgba(109,40,217,0.3)',
            opacity: doctor.available ? 1 : 0.5,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            {initials}
          </div>
        )}

        {/* Availability badge */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: doctor.available ? 'rgba(220,252,231,0.95)' : 'rgba(243,244,246,0.95)',
          color: doctor.available ? '#15803d' : '#9ca3af',
          fontSize: '10px', fontWeight: 700,
          padding: '4px 10px', borderRadius: '100px',
          display: 'flex', alignItems: 'center', gap: '5px',
          backdropFilter: 'blur(4px)',
          zIndex: 1,
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: doctor.available ? '#22c55e' : '#9ca3af',
            display: 'inline-block',
            boxShadow: doctor.available ? '0 0 0 2px rgba(34,197,94,0.3)' : 'none',
          }} />
          {doctor.available ? 'Available' : 'Unavailable'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '2px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {doctor.name}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
          {doctor.speciality}
        </div>

        {/* Rating + Experience row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#f59e0b', fontSize: '13px' }}>{'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginLeft: '2px' }}>{rating.toFixed(1)}</span>
          </div>
          <span style={{ color: '#e2e8f0', fontSize: '12px' }}>|</span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{doctor.experience}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1px' }}>Consultation fee</div>
            <span style={{ fontSize: '16px', fontWeight: 800, color: P }}>
              ₹{doctor.fee}
            </span>
          </div>
          <button
            disabled={!doctor.available}
            onClick={e => { e.stopPropagation(); goToDoctor(); }}
            style={{
              padding: '8px 18px',
              background: doctor.available ? P : '#f3f4f6',
              color: doctor.available ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: 700,
              cursor: doctor.available ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
              letterSpacing: '0.1px',
            }}
            onMouseEnter={e => { if (doctor.available) e.currentTarget.style.background = '#7c3aed'; }}
            onMouseLeave={e => { if (doctor.available) e.currentTarget.style.background = P; }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
