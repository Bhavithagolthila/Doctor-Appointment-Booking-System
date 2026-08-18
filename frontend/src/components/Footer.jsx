import { Link } from 'react-router-dom';

const P = '#6D28D9';

export default function Footer() {
  return (
    <footer style={{
      background: '#111827',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'56px 40px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.2fr', gap:'40px', paddingBottom:'44px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}
          className="footer-grid">

          {/* Brand col */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ width:'36px', height:'36px', background:`linear-gradient(135deg, ${P}, #8b5cf6)`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px' }}>🏥</div>
              <span style={{ fontWeight:800, fontSize:'17px', color:'#fff' }}>MediCare</span>
            </div>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.8, margin:'0 0 22px', maxWidth:'210px' }}>
              India's trusted doctor appointment platform — verified specialists, transparent fees, instant booking.
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              {[
                { label:'f',  bg:'#1877f2' },
                { label:'in', bg:'#0a66c2' },
                { label:'ig', bg:'#e1306c' },
              ].map(s => (
                <a key={s.label} href="#"
                  style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', color:'rgba(255,255,255,0.55)', fontSize:'11px', fontWeight:700, transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = s.bg; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = s.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >{s.label}</a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontWeight:700, fontSize:'11px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'18px' }}>Company</div>
            {[['/', 'Home'], ['/doctors', 'Find Doctors'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([to, label]) => (
              <div key={to} style={{ marginBottom:'12px' }}>
                <Link to={to} style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)', textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.color='#fff'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.45)'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontWeight:700, fontSize:'11px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'18px' }}>Legal</div>
            {['Privacy Policy','Terms of Use','Refund Policy','Cookie Policy'].map(label => (
              <div key={label} style={{ marginBottom:'12px' }}>
                <a href="#" style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)', textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.color='#fff'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.45)'}
                >{label}</a>
              </div>
            ))}
          </div>

          {/* Support */}
          <div>
            <div style={{ fontWeight:700, fontSize:'11px', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'18px' }}>Support</div>
            {[
              { icon:'📞', text:'+91 98765 43210' },
              { icon:'✉️', text:'support@medicare.in' },
              { icon:'📍', text:'Mumbai, India' },
              { icon:'🕒', text:'24/7 Support' },
            ].map(item => (
              <div key={item.text} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                <span style={{ fontSize:'13px', opacity:0.7 }}>{item.icon}</span>
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 0', flexWrap:'wrap', gap:'8px' }}>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>© 2026 MediCare. All rights reserved.</div>
          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
            {['General Physician','Neurologist','Dermatologist','Pediatrician'].map(s => (
              <Link key={s} to="/doctors" style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.25)'}
              >{s}</Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 500px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
