import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors } from '../api/doctors';
import DoctorCard from '../components/DoctorCard';

const P     = '#6D28D9';
const P2    = '#8B5CF6';
const LIGHT = '#F5F3FF';

const SPECIALITIES = [
  { name: 'General Physician', icon: '🩺', desc: 'Primary care & check-ups',   count: '2 doctors' },
  { name: 'Gynecologist',      icon: '👩‍⚕️', desc: "Women's health & maternity",  count: '2 doctors' },
  { name: 'Dermatologist',     icon: '✨', desc: 'Skin, hair & nail care',       count: '2 doctors' },
  { name: 'Pediatricians',     icon: '👶', desc: "Child & newborn care",         count: '2 doctors' },
  { name: 'Neurologist',       icon: '🧠', desc: 'Brain, spine & nerve care',    count: '2 doctors' },
  { name: 'Gastroenterologist',icon: '🏥', desc: 'Digestive health',             count: '2 doctors' },
];

const WHY = [
  { icon: '✅', title: 'Verified Doctors',    desc: 'Every doctor is background-checked and MBBS certified before listing.' },
  { icon: '⚡', title: 'Instant Booking',     desc: 'Confirmed appointment in under 2 minutes — no phone calls needed.' },
  { icon: '💰', title: 'Transparent Fees',    desc: 'Clear ₹ pricing shown upfront. Zero hidden charges or surprise bills.' },
  { icon: '🔒', title: 'Secure Records',      desc: 'Your health data is encrypted and private — always under your control.' },
  { icon: '📱', title: '24/7 Support',         desc: 'Our support team is available around the clock for any help you need.' },
  { icon: '↩️', title: 'Easy Cancellation',   desc: 'Cancel or reschedule appointments anytime — no questions asked.' },
];

const TESTIMONIALS = [
  { name: 'Rahul S.',    city: 'Mumbai',    stars: 5, text: 'Booked an appointment in literally 2 minutes. The doctor was punctual and very thorough. Will definitely use again.' },
  { name: 'Priya M.',   city: 'Bangalore', stars: 5, text: 'Super smooth experience. I loved that I could see the doctor\'s fee upfront and choose a slot that worked for me.' },
  { name: 'Arjun K.',   city: 'Delhi',     stars: 5, text: 'Much better than calling clinics. Got a confirmed slot with a specialist the same day. Highly recommend.' },
];

const FAQS = [
  { q: 'How do I book an appointment?',         a: 'Browse doctors by speciality, pick a slot that suits you, and pay online. You\'ll get an instant confirmation on screen and via email.' },
  { q: 'Can I cancel or reschedule?',            a: 'Yes, you can cancel or reschedule from My Appointments any time before your slot. Refunds are processed within 3–4 business days.' },
  { q: 'Are all doctors verified?',              a: 'Absolutely. Every doctor on MediCare has submitted their MBBS certificate, medical registration number, and ID proof before being listed.' },
  { q: 'What payment methods are accepted?',     a: 'We accept UPI (GPay, PhonePe, Paytm), all major debit/credit cards, and net banking. Cash on visit is also available for some clinics.' },
  { q: 'Can I see the doctor\'s fee before booking?', a: 'Yes — consultation fees are always shown upfront on every doctor card and detail page. No surprises.' },
];

export default function Home() {
  const navigate   = useNavigate();
  const [doctors, setDoctors]   = useState([]);
  const [search, setSearch]     = useState('');
  const [openFaq, setOpenFaq]   = useState(null);
  const heroRef    = useRef(null);

  useEffect(() => {
    getAllDoctors().then(d => setDoctors(d)).catch(() => {});
  }, []);

  const topDoctors = doctors.filter(d => d.available).slice(0, 6);
  const showDoctors = topDoctors.length > 0 ? topDoctors : doctors.slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/doctors?search=${encodeURIComponent(search.trim())}`);
    else navigate('/doctors');
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: '#0f172a', background: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .fade-up {
          opacity: 0;
          transform: translateY(22px);
          animation: fadeUp 0.55s ease forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .spec-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 22px 16px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .spec-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${LIGHT}, #ede9fe);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .spec-card:hover { border-color: ${P}; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(109,40,217,0.12); }
        .spec-card:hover::before { opacity: 1; }
        .spec-card > * { position: relative; }

        .doctor-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .why-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 22px;
          transition: all 0.2s ease;
        }
        .why-card:hover { border-color: ${P2}; box-shadow: 0 6px 20px rgba(109,40,217,0.08); }

        .testi-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 16px;
          padding: 26px;
          transition: box-shadow 0.2s ease;
        }
        .testi-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); }

        .faq-item {
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }
        .faq-item:last-child { border-bottom: none; }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: transparent;
          padding: 0;
        }
        .search-input::placeholder { color: #94a3b8; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          color: #e0d9ff;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 22px;
        }

        .primary-btn {
          padding: 13px 28px;
          background: ${P};
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.1px;
        }
        .primary-btn:hover { background: #7c3aed; transform: translateY(-1px); }

        .ghost-btn {
          padding: 13px 28px;
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .ghost-btn:hover { background: rgba(255,255,255,0.18); }

        .section-tag {
          display: inline-block;
          background: ${LIGHT};
          color: ${P};
          border-radius: 100px;
          padding: 4px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .hero-grid   { grid-template-columns: 1fr !important; }
          .hero-right  { display: none !important; }
          @media (min-width: 901px) { .hero-right { display: flex !important; } }
          .doctor-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .why-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .spec-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .testi-grid  { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .doctor-grid { grid-template-columns: 1fr !important; }
          .why-grid    { grid-template-columns: 1fr !important; }
          .spec-grid   { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, #3b0764 0%, #7c3aed 40%, #6D28D9 100%)`,
        position: 'relative', overflow: 'hidden', minHeight: '560px', display: 'flex', alignItems: 'center',
      }}>
        {/* blobs */}
        <div style={{ position:'absolute', top:'-100px', right:'-80px', width:'500px', height:'500px', background:'rgba(139,92,246,0.2)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-60px', width:'400px', height:'400px', background:'rgba(196,181,253,0.1)', borderRadius:'50%', filter:'blur(70px)', pointerEvents:'none' }} />

        <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'80px 40px', display:'grid', gridTemplateColumns:'1fr', gap:'60px', alignItems:'center', position:'relative', width:'100%', textAlign:'center' }}>

          {/* CENTER — text */}
          <div className="fade-up" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div className="hero-badge">🇮🇳 India's Trusted Healthcare Platform</div>
            <h1 style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:'clamp(32px, 4.8vw, 62px)', fontWeight:800, margin:'0 0 20px', color:'#fff', lineHeight:1.15, letterSpacing:'-0.5px', textAlign:'center' }}>
              Find and Book Trusted Doctors<br /><span style={{ color:'#c4b5fd' }}>Near You.</span>
            </h1>
            <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.7)', margin:'0 0 36px', lineHeight:1.8, maxWidth:'560px', textAlign:'center' }}>
              Book appointments with verified specialists across India — instantly, securely, and in ₹. No calls, no waiting.
            </p>

            {/* CTA buttons */}
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'48px', justifyContent:'center' }}>
              <button onClick={() => navigate('/doctors')} className="primary-btn" style={{ padding:'14px 32px', fontSize:'15px', background:'#fff', color:P, border:'none', borderRadius:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(0,0,0,0.2)', transition:'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >Book Appointment →</button>
              <button onClick={() => navigate('/doctors')} style={{ padding:'14px 32px', fontSize:'15px', background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >Browse Doctors</button>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:'0', justifyContent:'center' }}>
              {[
                { num:'10+',   label:'Verified Doctors' },
                { num:'6',     label:'Specialties' },
                { num:'2 min', label:'Avg. Booking Time' },
              ].map((s, i, arr) => (
                <div key={s.label} style={{ paddingRight:'28px', marginRight:'28px', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                  <div style={{ fontSize:'24px', fontWeight:800, color:'#fff', lineHeight:1 }}>{s.num}</div>
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', marginTop:'4px', fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>



        </div>
      </section>



      {/* ── SPECIALTIES ── */}
      <section style={{ padding:'72px 40px', maxWidth:'1140px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <span className="section-tag">Specialities</span>
            <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>Find the Right Specialist</h2>
          </div>
          <button onClick={() => navigate('/doctors')} style={{ padding:'9px 18px', background:LIGHT, color:P, border:`1.5px solid #ede9fe`, borderRadius:'10px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#ede9fe'}
            onMouseLeave={e => e.currentTarget.style.background=LIGHT}
          >Browse all →</button>
        </div>
        <div className="spec-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
          {SPECIALITIES.map(s => (
            <button key={s.name} className="spec-card" onClick={() => navigate(`/doctors?speciality=${encodeURIComponent(s.name)}`)} style={{ minHeight:'150px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'10px', lineHeight:1 }}>{s.icon}</div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#0f172a', marginBottom:'4px', lineHeight:1.3, textAlign:'center' }}>{s.name}</div>
              <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'8px', lineHeight:1.3, textAlign:'center' }}>{s.desc}</div>
              <div style={{ fontSize:'10px', fontWeight:600, color:P, background:LIGHT, borderRadius:'100px', padding:'2px 10px', display:'inline-block', whiteSpace:'nowrap' }}>{s.count}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section style={{ background:'#fafafa', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', padding:'72px 40px' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <span className="section-tag">Why MediCare</span>
            <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>Healthcare Made Simple</h2>
            <p style={{ margin:'12px auto 0', color:'#64748b', fontSize:'15px', maxWidth:'480px', lineHeight:1.7 }}>
              We connect you with the right doctor at the right time — no paperwork, no long waits, no hidden fees.
            </p>
          </div>
          <div className="why-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {WHY.map((w, i) => (
              <div key={w.title} className="why-card" style={{ animationDelay:`${i*0.07}s` }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:LIGHT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', marginBottom:'14px' }}>{w.icon}</div>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'6px' }}>{w.title}</div>
                <div style={{ fontSize:'13px', color:'#64748b', lineHeight:1.65 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP DOCTORS ── */}
      <section style={{ padding:'72px 40px', maxWidth:'1140px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <span className="section-tag">Our Doctors</span>
            <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>Top Rated Specialists</h2>
          </div>
          <button onClick={() => navigate('/doctors')} style={{ padding:'9px 18px', background:'#fff', border:`1.5px solid ${P}`, color:P, borderRadius:'10px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            All doctors →
          </button>
        </div>
        <div className="doctor-grid">
          {showDoctors.map(doc => <DoctorCard key={doc._id || doc.id} doctor={doc} />)}
          {showDoctors.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#94a3b8', fontSize:'14px' }}>
              Loading doctors…
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:'#fafafa', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', padding:'72px 40px' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <span className="section-tag">How It Works</span>
            <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>Book in 3 Simple Steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0', position:'relative' }}>
            {/* connector line */}
            <div style={{ position:'absolute', top:'28px', left:'calc(16.66% + 20px)', right:'calc(16.66% + 20px)', height:'2px', background:'linear-gradient(90deg, #ede9fe, #c4b5fd, #ede9fe)', zIndex:0 }} />
            {[
              { n:'1', icon:'🔍', title:'Find a Specialist', desc:'Browse 6+ specialities and choose a verified doctor based on ratings, fee, and experience.' },
              { n:'2', icon:'📅', title:'Select Your Slot',  desc:'Pick a date and time that works for you. Real-time availability, no guessing required.' },
              { n:'3', icon:'✅', title:'Pay & Confirm',     desc:'Pay via UPI, card, or net banking. Get an instant booking confirmation on screen.' },
            ].map((s, i) => (
              <div key={s.n} style={{ textAlign:'center', padding:'28px 36px', position:'relative', zIndex:1 }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background: i===1 ? P : '#fff', border: i===1 ? 'none' : '2px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', margin:'0 auto 18px', boxShadow: i===1 ? `0 4px 20px rgba(109,40,217,0.35)` : 'none' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'8px' }}>{s.title}</div>
                <div style={{ fontSize:'13px', color:'#64748b', lineHeight:1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:'72px 40px', maxWidth:'1140px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'44px' }}>
          <span className="section-tag">Testimonials</span>
          <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>What Patients Say</h2>
        </div>
        <div className="testi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testi-card">
              <div style={{ color:'#f59e0b', fontSize:'17px', marginBottom:'14px', letterSpacing:'2px' }}>{'★'.repeat(t.stars)}</div>
              <p style={{ fontSize:'14px', color:'#374151', lineHeight:1.75, margin:'0 0 20px', fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:`linear-gradient(135deg, ${P}, ${P2})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'13px', fontWeight:700 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize:'11px', color:'#94a3b8' }}>{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background:'#fafafa', borderTop:'1px solid #f1f5f9', padding:'72px 40px' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <span className="section-tag">FAQ</span>
            <h2 style={{ margin:'0', fontSize:'26px', fontWeight:800, fontFamily:"'Playfair Display', Georgia, serif" }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e5e7eb', overflow:'hidden' }}>
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', gap:'16px' }}>
                  <span style={{ fontSize:'14px', fontWeight:600, color:'#0f172a' }}>{f.q}</span>
                  <span style={{ fontSize:'18px', color:P, flexShrink:0, transition:'transform 0.2s', transform: openFaq===i ? 'rotate(45deg)' : 'none' }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding:'0 24px 18px', fontSize:'13px', color:'#64748b', lineHeight:1.75 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background:`linear-gradient(135deg, #3b0764, #7c3aed, #6D28D9)`, padding:'72px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'220px', height:'220px', background:'rgba(196,181,253,0.15)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'220px', height:'220px', background:'rgba(139,92,246,0.15)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ maxWidth:'560px', margin:'0 auto', position:'relative' }}>
          <h2 style={{ margin:'0 0 12px', fontSize:'clamp(22px, 3vw, 32px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display', Georgia, serif" }}>
            Take the First Step Today
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.65)', margin:'0 0 32px', lineHeight:1.75 }}>
            Join thousands of patients who've already made healthcare simpler with MediCare.
          </p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="primary-btn" onClick={() => navigate('/register')} style={{ background:'#fff', color:P }}>
              Create Free Account
            </button>
            <button className="ghost-btn" onClick={() => navigate('/doctors')}>
              Browse Doctors
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
