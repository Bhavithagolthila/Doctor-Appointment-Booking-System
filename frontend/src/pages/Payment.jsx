import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookAppointment } from '../api/appointments';
import { resolveImageUrl } from '../utils/imageUrl';

const PRIMARY = '#7c3aed';
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'];

function formatCardNumber(v) { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function formatExpiry(v) { const d=v.replace(/\D/g,'').slice(0,4); return d.length>=3?d.slice(0,2)+'/'+d.slice(2):d; }
function fmtDate(iso) {
  if (!iso) return iso;
  try { return new Date(iso+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
  catch { return iso; }
}

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { doctor, date, time, user } = state || {};

  const [tab, setTab] = useState('upi');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // appointment data after success
  const [errors, setErrors] = useState({});

  if (!doctor) return (
    <div style={{padding:'60px 24px',textAlign:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#dc2626'}}>No booking info found.</p>
      <button onClick={() => navigate('/doctors')} style={{marginTop:'12px',padding:'10px 22px',background:PRIMARY,color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>Find Doctors</button>
    </div>
  );

  const total = doctor.fee;

  const validate = () => {
    const e = {};
    if (tab === 'card') {
      if (cardNumber.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter valid 16-digit card number';
      if (!cardName.trim()) e.cardName = 'Enter cardholder name';
      if (expiry.length < 5) e.expiry = 'Enter valid expiry MM/YY';
      if (cvv.length < 3) e.cvv = 'Enter valid CVV';
    } else if (tab === 'upi') {
      if (!upiId.includes('@')) e.upiId = 'Enter valid UPI ID (e.g. name@gpay)';
    } else if (tab === 'netbanking') {
      if (!bank) e.bank = 'Please select a bank';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setProcessing(true);
    setErrors({});
    try {
      await new Promise(r => setTimeout(r, 2000)); // simulate processing
      const methodMap = { upi:'UPI', card:'Card', netbanking:'NetBanking', cash:'Cash' };
      const appt = await bookAppointment({
        doctorId: doctor._id || doctor.id,
        date,
        time,
        paymentMethod: methodMap[tab],
      });
      setResult(appt);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Payment failed. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const inp = (hasErr) => ({
    width:'100%', padding:'11px 14px',
    border:`1.5px solid ${hasErr ? '#dc2626':'#e5e7eb'}`,
    borderRadius:'10px', fontSize:'14px', fontFamily:'system-ui',
    outline:'none', boxSizing:'border-box', background:'#fff',
  });

  /* ── SUCCESS ── */
  if (result) {
    const isCash = result.paymentMethod === 'Cash';
    return (
      <div style={{fontFamily:'system-ui',background:'#f8fafc',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
        <div style={{background:'#fff',borderRadius:'24px',padding:'48px 40px',textAlign:'center',maxWidth:'460px',width:'100%',boxShadow:'0 8px 40px rgba(124,58,237,0.15)',border:'1px solid #ede9fe'}}>
          <div style={{width:'76px',height:'76px',background:isCash?'#fef3c7':'#f5f3ff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'34px',margin:'0 auto 20px',border:`3px solid ${isCash?'#f59e0b':PRIMARY}`}}>
            {isCash ? '🏥' : '✓'}
          </div>
          <h2 style={{fontSize:'24px',fontWeight:800,margin:'0 0 8px',fontFamily:"'Segoe UI', sans-serif",color:'#111'}}>
            {isCash ? 'Appointment Booked!' : 'Payment Successful!'}
          </h2>
          {!isCash && (
            <div style={{display:'inline-block',background:'#fef3c7',color:'#92400e',fontSize:'11px',fontWeight:800,padding:'3px 10px',borderRadius:'20px',letterSpacing:'0.4px',textTransform:'uppercase',marginBottom:'10px'}}>
              Demo Payment — No Real Money Charged
            </div>
          )}
          <p style={{color:'#6b7280',margin:'0 0 8px',lineHeight:1.7,fontSize:'14px'}}>
            Your appointment with <strong>{doctor.name}</strong> is {isCash ? 'booked' : 'confirmed'}.
          </p>
          {isCash && (
            <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',fontSize:'13px',color:'#92400e',textAlign:'left'}}>
              <strong>💵 Pay at Hospital:</strong> Please carry ₹{total} and pay at the reception before your appointment.
            </div>
          )}
          <div style={{background:'#f5f3ff',borderRadius:'12px',padding:'16px',marginBottom:'24px',textAlign:'left'}}>
            {[
              ['👨‍⚕️ Doctor', doctor.name],
              ['🏥 Speciality', doctor.speciality],
              ['📅 Date', fmtDate(date)],
              ['⏰ Time', time],
              ['💰 Fee', `₹${total}${isCash?' (pay at hospital)':' (paid)' }`],
              ['🆔 Booking ID', `#${result._id?.slice(-8).toUpperCase() || 'AP'+Date.now().toString().slice(-6)}`],
              ...(!isCash ? [['🧾 Demo Transaction ID', `DEMO-TXN-${(result._id?.slice(-6) || Date.now().toString().slice(-6)).toUpperCase()}`]] : []),
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'13px'}}>
                <span style={{color:'#6b7280'}}>{k}</span>
                <span style={{fontWeight:600,color:'#111',textAlign:'right',maxWidth:'200px'}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={() => navigate('/my-appointments')} style={{flex:1,padding:'12px',background:PRIMARY,color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
              View Appointments
            </button>
            <button onClick={() => navigate('/')} style={{flex:1,padding:'12px',background:'#f5f3ff',color:PRIMARY,border:`1px solid #ddd6fe`,borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { id:'upi',        label:'📱', title:'UPI' },
    { id:'card',       label:'💳', title:'Card' },
    { id:'netbanking', label:'🏦', title:'Net Banking' },
    { id:'cash',       label:'🏥', title:'Pay at Hospital' },
  ];

  return (
    <div style={{fontFamily:'system-ui',background:'#f8fafc',minHeight:'100vh',padding:'32px 24px'}}>
      {/* Processing overlay */}
      {processing && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
          <div style={{fontSize:'52px',marginBottom:'20px'}}>🧪</div>
          <div style={{fontSize:'22px',fontWeight:800,marginBottom:'8px'}}>Simulating Payment…</div>
          <div style={{fontSize:'14px',opacity:0.8}}>Demo mode — no real transaction is being processed</div>
          <div style={{marginTop:'24px',width:'200px',height:'4px',background:'rgba(255,255,255,0.2)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{height:'100%',background:PRIMARY,borderRadius:'2px',animation:'progress 2s linear forwards'}} />
          </div>
        </div>
      )}

      <div style={{maxWidth:'840px',margin:'0 auto'}}>
        <button onClick={() => navigate(-1)} style={{background:'none',border:'none',color:PRIMARY,cursor:'pointer',fontSize:'14px',fontWeight:600,padding:0,marginBottom:'20px'}}>← Back</button>
        <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap',marginBottom:'6px'}}>
          <h1 style={{fontSize:'26px',fontWeight:800,margin:0,fontFamily:"'Segoe UI', sans-serif",color:'#111'}}>Complete Payment</h1>
          <span style={{background:'#fef3c7',color:'#92400e',fontSize:'11px',fontWeight:800,padding:'4px 10px',borderRadius:'20px',letterSpacing:'0.4px',textTransform:'uppercase'}}>Demo Payment</span>
        </div>
        <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 24px'}}>This is a simulated checkout for demo purposes — no real transaction is processed and no real money is charged.</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'24px',alignItems:'start'}}>

          {/* Left */}
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',boxShadow:'0 4px 20px rgba(124,58,237,0.08)',border:'1px solid #ede9fe'}}>
            {/* Tabs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'28px'}}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setErrors({}); }} style={{
                  padding:'10px 4px',border:`2px solid ${tab===t.id?PRIMARY:'#e5e7eb'}`,
                  borderRadius:'12px',background:tab===t.id?'#f5f3ff':'#fff',
                  cursor:'pointer',textAlign:'center',transition:'all 0.2s',
                }}>
                  <div style={{fontSize:'18px',marginBottom:'4px'}}>{t.label}</div>
                  <div style={{fontSize:'10px',fontWeight:700,color:tab===t.id?PRIMARY:'#6b7280',lineHeight:1.2}}>{t.title}</div>
                </button>
              ))}
            </div>

            {/* UPI */}
            {tab==='upi' && (
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div>
                  <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'6px'}}>UPI ID</label>
                  <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@gpay / @paytm / @phonepe"
                    style={inp(errors.upiId)}
                    onFocus={e=>e.target.style.borderColor=PRIMARY}
                    onBlur={e=>e.target.style.borderColor=errors.upiId?'#dc2626':'#e5e7eb'}
                  />
                  {errors.upiId && <div style={{color:'#dc2626',fontSize:'12px',marginTop:'4px'}}>{errors.upiId}</div>}
                </div>
                <div style={{fontSize:'12px',fontWeight:600,color:'#6b7280',marginBottom:'4px'}}>OR SELECT APP</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                  {['GPay','PhonePe','Paytm','BHIM','Amazon Pay','Cred'].map(app => {
                    const val = app.toLowerCase().replace(' ','')+'@upi';
                    return (
                      <button key={app} onClick={()=>setUpiId(val)} style={{
                        padding:'10px 6px',border:`2px solid ${upiId===val?PRIMARY:'#e5e7eb'}`,
                        borderRadius:'10px',background:upiId===val?'#f5f3ff':'#fff',
                        cursor:'pointer',fontSize:'12px',fontWeight:600,color:upiId===val?PRIMARY:'#374151',
                      }}>{app}</button>
                    );
                  })}
                </div>
                <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',padding:'8px 12px',borderRadius:'8px',fontSize:'12px',color:PRIMARY}}>
                  🧪 Simulated UPI payment — no real transaction is made
                </div>
              </div>
            )}

            {/* Card */}
            {tab==='card' && (
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                {[
                  {label:'Card Number',      val:cardNumber, set:v=>setCardNumber(formatCardNumber(v)), ph:'1234 5678 9012 3456', ml:19, err:'cardNumber'},
                  {label:'Cardholder Name',  val:cardName,   set:v=>setCardName(v),                    ph:'Name on card',        ml:50, err:'cardName'},
                ].map(f => (
                  <div key={f.label}>
                    <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'6px'}}>{f.label}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} maxLength={f.ml} style={inp(errors[f.err])}
                      onFocus={e=>e.target.style.borderColor=PRIMARY}
                      onBlur={e=>e.target.style.borderColor=errors[f.err]?'#dc2626':'#e5e7eb'}
                    />
                    {errors[f.err] && <div style={{color:'#dc2626',fontSize:'12px',marginTop:'4px'}}>{errors[f.err]}</div>}
                  </div>
                ))}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'6px'}}>Expiry (MM/YY)</label>
                    <input value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} style={inp(errors.expiry)}
                      onFocus={e=>e.target.style.borderColor=PRIMARY} onBlur={e=>e.target.style.borderColor=errors.expiry?'#dc2626':'#e5e7eb'} />
                    {errors.expiry && <div style={{color:'#dc2626',fontSize:'12px',marginTop:'4px'}}>{errors.expiry}</div>}
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'6px'}}>CVV</label>
                    <input value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" type="password" maxLength={4} style={inp(errors.cvv)}
                      onFocus={e=>e.target.style.borderColor=PRIMARY} onBlur={e=>e.target.style.borderColor=errors.cvv?'#dc2626':'#e5e7eb'} />
                    {errors.cvv && <div style={{color:'#dc2626',fontSize:'12px',marginTop:'4px'}}>{errors.cvv}</div>}
                  </div>
                </div>
                <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',padding:'8px 12px',borderRadius:'8px',fontSize:'12px',color:PRIMARY}}>🧪 Demo card form — no real card is charged or stored</div>
              </div>
            )}

            {/* Net Banking */}
            {tab==='netbanking' && (
              <div>
                <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'10px'}}>Select Your Bank</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {BANKS.map(b => (
                    <button key={b} onClick={()=>setBank(b)} style={{
                      padding:'12px 10px',border:`2px solid ${bank===b?PRIMARY:'#e5e7eb'}`,
                      borderRadius:'10px',background:bank===b?'#f5f3ff':'#fff',
                      cursor:'pointer',fontSize:'12px',fontWeight:600,
                      color:bank===b?PRIMARY:'#374151',textAlign:'left',
                    }}>🏦 {b}</button>
                  ))}
                </div>
                {errors.bank && <div style={{color:'#dc2626',fontSize:'12px',marginTop:'8px'}}>{errors.bank}</div>}
              </div>
            )}

            {/* Cash */}
            {tab==='cash' && (
              <div style={{textAlign:'center',padding:'16px 0'}}>
                <div style={{fontSize:'52px',marginBottom:'16px'}}>🏥</div>
                <h3 style={{fontSize:'18px',fontWeight:800,margin:'0 0 10px',color:'#111'}}>Pay at Hospital</h3>
                <p style={{color:'#6b7280',fontSize:'14px',lineHeight:1.7,margin:'0 0 20px'}}>
                  No online payment needed. Simply visit the hospital and pay <strong style={{color:PRIMARY}}>₹{total}</strong> in cash at the reception before your appointment.
                </p>
                <div style={{background:'#f5f3ff',border:'1.5px solid #ddd6fe',borderRadius:'12px',padding:'14px 18px',textAlign:'left'}}>
                  {['Bring this booking confirmation','Arrive 10 mins before your slot','Pay at reception in cash'].map(tip => (
                    <div key={tip} style={{display:'flex',gap:'8px',alignItems:'center',fontSize:'13px',color:'#374151',marginBottom:'6px'}}>
                      <span style={{color:PRIMARY,fontWeight:700}}>✓</span> {tip}
                    </div>
                  ))}
                </div>
                <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'8px',padding:'10px 14px',marginTop:'14px',fontSize:'12px',color:'#92400e'}}>
                  ⚠️ Appointment will be marked as <strong>Pending</strong> until you pay at the hospital.
                </div>
              </div>
            )}

            {errors.submit && (
              <div style={{color:'#dc2626',fontSize:'13px',background:'#fef2f2',padding:'10px 14px',borderRadius:'8px',marginTop:'16px',border:'1px solid #fecaca'}}>
                {errors.submit}
              </div>
            )}

            <button onClick={handlePay} disabled={processing} style={{
              width:'100%',padding:'14px',marginTop:'24px',
              background:processing?'#ddd6fe':PRIMARY,color:'#fff',
              border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:700,
              cursor:processing?'not-allowed':'pointer',
              boxShadow:processing?'none':'0 4px 12px rgba(124,58,237,0.3)',
            }}>
              {processing ? 'Processing…' : tab==='cash' ? `Confirm Booking — ₹${total} at Hospital` : `Pay ₹${total} Now →`}
            </button>
          </div>

          {/* Right: Summary */}
          <div>
            <div style={{background:'#fff',borderRadius:'20px',padding:'24px',boxShadow:'0 4px 20px rgba(124,58,237,0.08)',border:'1px solid #ede9fe',marginBottom:'12px'}}>
              <h3 style={{margin:'0 0 16px',fontSize:'16px',fontWeight:700,fontFamily:"'Segoe UI', sans-serif",color:'#111'}}>Booking Summary</h3>
              <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'16px',padding:'12px',background:'#f5f3ff',borderRadius:'12px'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'10px',overflow:'hidden',flexShrink:0,background:'#ede9fe'}}>
                  <img src={resolveImageUrl(doctor.image)} alt={doctor.name} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}} onError={e=>e.target.style.display='none'} />
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:'14px',color:'#111'}}>{doctor.name}</div>
                  <div style={{fontSize:'12px',color:PRIMARY}}>{doctor.speciality}</div>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'13px',marginBottom:'16px'}}>
                {[['📅 Date',fmtDate(date)],['⏰ Time',time],['👤 Patient',user?.name]].map(([k,v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'#6b7280'}}>{k}</span>
                    <span style={{fontWeight:600,color:'#111',textAlign:'right',maxWidth:'160px'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{borderTop:'1px solid #f0f0f0',paddingTop:'14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px',color:'#6b7280'}}>
                  <span>Consultation fee</span><span>₹{doctor.fee}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,marginTop:'8px'}}>
                  <span>Total</span><span style={{color:PRIMARY}}>₹{total}</span>
                </div>
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'16px',boxShadow:'0 2px 10px rgba(0,0,0,0.04)',border:'1px solid #ede9fe'}}>
              {[['🧪','Demo payment — no real charge'],['↩️','Cancel 24h before slot'],['✅','Instant confirmation']].map(([icon,text]) => (
                <div key={text} style={{display:'flex',gap:'10px',alignItems:'center',fontSize:'12px',color:'#374151',marginBottom:'8px'}}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
