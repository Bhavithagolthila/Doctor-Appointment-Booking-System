import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserAppointments, cancelAppointment } from '../api/appointments';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';

const PRIMARY = '#7c3aed';

const STATUS_CONFIG = {
  pending:   { color: '#d97706', bg: '#fef3c7', label: 'Pending' },
  confirmed: { color: PRIMARY,   bg: '#f5f3ff', label: 'Confirmed' },
  completed: { color: '#111827', bg: '#f3f4f6', label: 'Completed' },
  cancelled: { color: '#e11d48', bg: '#fef2f2', label: 'Cancelled' },
};

function fmtDate(iso) {
  if (!iso) return iso;
  try { return new Date(iso+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric'}); }
  catch { return iso; }
}

// FIX: matches the backend's 24-hour cancellation window (see
// backend/routes/appointments.js) so the Cancel button reflects the same
// rule the server will actually enforce, instead of always showing it for
// any pending/confirmed appointment and letting the server reject it with
// a generic error after the fact. Parsing with an explicit "+05:30" offset
// gives the true UTC instant for these IST wall-clock date/time strings.
function hoursUntilAppointment(date, time) {
  const apptInstant = new Date(`${date}T${time}:00+05:30`);
  return (apptInstant.getTime() - Date.now()) / 3600000;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [cancelling, setCancelling] = useState(null);
  const [refundMsg, setRefundMsg] = useState(''); // show refund toast

  const load = () => {
    setLoading(true);
    setError('');
    // FIX: a failed fetch used to silently render an empty "No appointments
    // found" state — indistinguishable from a genuinely empty list. Now
    // shows a real error with a retry action instead of hiding the failure.
    getUserAppointments(user.id || user._id)
      .then(setAppointments)
      .catch(() => setError('Unable to load your appointments. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleCancel = async (appt) => {
    // FIX: this is a demo payment system with no real payment gateway behind
    // it (see Payment.jsx) — the original copy here ("refund will be
    // credited to your account") read like a real financial promise. Now
    // explicitly labeled as a demo/simulated refund so it can't be mistaken
    // for a real transaction, matching the "Demo Payment" labeling used
    // everywhere else in the checkout flow.
    const msg = appt.paymentStatus === 'paid'
      ? 'Cancel this appointment? This was a demo payment, so no real refund is processed — a simulated refund of ₹' + appt.fee + ' will show here for demo purposes.'
      : 'Cancel this appointment?';
    if (!window.confirm(msg)) return;
    setCancelling(appt._id);
    try {
      await cancelAppointment(appt._id);
      setAppointments(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a));
      if (appt.paymentStatus === 'paid') {
        setRefundMsg(`Appointment cancelled. Demo refund of ₹${appt.fee} shown for demo purposes — no real money was charged or refunded.`);
        setTimeout(() => setRefundMsg(''), 6000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel appointment');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter.toLowerCase());

  if (loading) return (
    <div style={{padding:'80px 24px',textAlign:'center',color:'#6b7280',fontFamily:'system-ui'}}>
      <div style={{fontSize:'32px',marginBottom:'12px'}}>⏳</div>Loading your appointments...
    </div>
  );

  if (error) return (
    <div style={{padding:'80px 24px',textAlign:'center',fontFamily:'system-ui'}}>
      <div style={{fontSize:'40px',marginBottom:'16px'}}>⚠️</div>
      <h2 style={{fontWeight:700,margin:'0 0 8px',color:'#111'}}>Something went wrong</h2>
      <p style={{color:'#6b7280',marginBottom:'24px',fontSize:'14px'}}>{error}</p>
      <button onClick={load} style={{padding:'12px 28px',background:PRIMARY,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
        Try again
      </button>
    </div>
  );

  return (
    <div style={{fontFamily:'system-ui',background:'#f8fafc',minHeight:'100vh',padding:'32px 24px'}}>
      {/* Refund notification */}
      {refundMsg && (
        <div style={{position:'fixed',top:'20px',right:'20px',background:'#111827',color:'#fff',padding:'14px 20px',borderRadius:'12px',fontSize:'13px',fontWeight:600,zIndex:1000,maxWidth:'380px',boxShadow:'0 8px 24px rgba(0,0,0,0.3)',lineHeight:1.5}}>
          ✅ {refundMsg}
        </div>
      )}

      <div style={{maxWidth:'860px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <h1 style={{margin:'0 0 4px',fontSize:'26px',fontWeight:800,fontFamily:"'Segoe UI', sans-serif",color:'#111'}}>My Appointments</h1>
            <p style={{margin:0,color:'#6b7280',fontSize:'14px'}}>{appointments.length} total</p>
          </div>
          <button onClick={() => navigate('/doctors')} style={{padding:'10px 22px',background:PRIMARY,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}>
            + Book New
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:'6px',marginBottom:'20px',flexWrap:'wrap'}}>
          {['All','Pending','Confirmed','Completed','Cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'7px 16px',
              background: filter===f ? PRIMARY : '#fff',
              color: filter===f ? '#fff' : '#374151',
              border:'1px solid', borderColor: filter===f ? PRIMARY : '#e2e8f0',
              borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer',
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 24px',background:'#fff',borderRadius:'20px',border:'1px solid #ede9fe'}}>
            <div style={{fontSize:'52px',marginBottom:'16px'}}>📅</div>
            <h2 style={{fontWeight:700,margin:'0 0 8px',fontFamily:"'Segoe UI', sans-serif",color:'#111'}}>No appointments found</h2>
            <p style={{color:'#6b7280',marginBottom:'24px',fontSize:'14px'}}>Book your first appointment with a trusted doctor.</p>
            <button onClick={() => navigate('/doctors')} style={{padding:'12px 28px',background:PRIMARY,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
              Find a Doctor
            </button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {filtered.map(a => {
              const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
              // FIX: no longer just "pending/confirmed" — also requires at
              // least 24h notice, consistent with the backend's actual rule.
              const withinCancelWindow = ['pending','confirmed'].includes(a.status) && hoursUntilAppointment(a.date, a.time) < 24;
              const canCancel = ['pending','confirmed'].includes(a.status) && !withinCancelWindow;
              return (
                <div key={a._id} style={{
                  background:'#fff', borderRadius:'16px', padding:'18px 22px',
                  boxShadow:'0 2px 12px rgba(124,58,237,0.07)', border:'1px solid #ede9fe',
                  display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap',
                  opacity: a.status==='cancelled' ? 0.7 : 1,
                }}>
                  {/* Doctor image circle */}
                  <div style={{width:'56px',height:'56px',borderRadius:'50%',overflow:'hidden',background:'#f5f3ff',flexShrink:0,border:`2px solid #ede9fe`}}>
                    {a.doctorImage ? (
                      <img src={resolveImageUrl(a.doctorImage)} alt={a.doctorName} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>{e.target.style.display='none';}} />
                    ) : (
                      <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:PRIMARY,fontWeight:700}}>
                        {a.doctorName?.[0] || '👨‍⚕️'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:'200px'}}>
                    <div style={{fontWeight:700,fontSize:'15px',color:'#111',marginBottom:'2px',fontFamily:"'Segoe UI', sans-serif"}}>{a.doctorName}</div>
                    <div style={{fontSize:'13px',color:PRIMARY,marginBottom:'6px'}}>{a.speciality}</div>
                    <div style={{display:'flex',gap:'14px',fontSize:'13px',color:'#6b7280',flexWrap:'wrap'}}>
                      <span>📅 {fmtDate(a.date)}</span>
                      <span>⏰ {a.time}</span>
                      <span>💰 ₹{a.fee}</span>
                    </div>
                    {a.paymentMethod === 'Cash' && a.status === 'pending' && (
                      <div style={{marginTop:'6px',fontSize:'11px',color:'#92400e',background:'#fef3c7',padding:'3px 8px',borderRadius:'4px',display:'inline-block'}}>
                        💵 Pay ₹{a.fee} at hospital
                      </div>
                    )}
                  </div>

                  {/* Status + Cancel */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'10px',flexShrink:0}}>
                    <span style={{padding:'4px 14px',borderRadius:'20px',fontSize:'12px',fontWeight:700,background:st.bg,color:st.color}}>
                      {st.label}
                    </span>
                    {canCancel && (
                      <button onClick={() => handleCancel(a)} disabled={cancelling===a._id} style={{
                        padding:'6px 14px',background:'#fef2f2',color:'#e11d48',
                        border:'1px solid #fecdd3',borderRadius:'8px',fontSize:'12px',
                        fontWeight:600,cursor:cancelling===a._id?'not-allowed':'pointer',
                        opacity:cancelling===a._id?0.6:1,
                      }}>
                        {cancelling===a._id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                    {withinCancelWindow && (
                      <div style={{fontSize:'11px',color:'#9ca3af',textAlign:'right',maxWidth:'150px',lineHeight:1.4}}>
                        Cancellation window has passed (24h notice required)
                      </div>
                    )}
                    {a.status === 'cancelled' && a.paymentStatus === 'paid' && (
                      <div style={{fontSize:'11px',color:'#6b7280',textAlign:'right',maxWidth:'140px',lineHeight:1.4}}>
                        💰 Demo refund shown (no real charge)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
