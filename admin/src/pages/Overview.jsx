import { useState, useEffect } from 'react';
import { getStats, toggleDoctorAvailability } from '../api/admin';

const PRIMARY = '#7c3aed';

const STATUS_STYLES = {
  pending:   { bg: '#fef3c7', color: '#d97706' },
  confirmed: { bg: '#f5f3ff', color: PRIMARY },
  completed: { bg: '#111827', color: '#fff' },
  cancelled: { bg: '#fef2f2', color: '#e11d48' },
};

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const load = () => {
    setLoading(true);
    getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await toggleDoctorAvailability(id);
      load();
    } finally { setToggling(null); }
  };

  if (loading) return (
    <div style={{padding:'60px',textAlign:'center',color:'#6b7280',fontFamily:'system-ui'}}>
      <div style={{fontSize:'32px',marginBottom:'12px'}}>⏳</div>
      Loading dashboard…
    </div>
  );

  // FIX: the stats API already returns totalDoctors/totalUsers, but this
  // dashboard never rendered them — spec calls for Total Doctors and Total
  // Patients alongside the appointment/revenue figures.
  const STAT_CARDS = [
    { label:'Total Doctors',      value: stats?.totalDoctors ?? 0,            icon:'👨‍⚕️', color: '#0891b2' },
    { label:'Total Patients',     value: stats?.totalUsers ?? 0,              icon:'👥', color: '#7c3aed' },
    { label:'Total Appointments', value: stats?.totalAppointments ?? 0,      icon:'📅', color: PRIMARY },
    { label:'Pending',            value: stats?.pendingAppointments ?? 0,     icon:'⏳', color: '#d97706' },
    { label:'Confirmed',          value: stats?.confirmedAppointments ?? 0,   icon:'✅', color: PRIMARY },
    { label:'Completed',          value: stats?.completedAppointments ?? 0,   icon:'🏁', color: '#374151' },
    { label:'Cancelled',          value: stats?.cancelledAppointments ?? 0,   icon:'❌', color: '#e11d48' },
    { label:'Total Revenue',      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon:'💰', color: '#059669' },
  ];

  return (
    <div style={{padding:'28px',fontFamily:'system-ui',background:'#f8fafc',minHeight:'100%'}}>
      <div style={{marginBottom:'28px'}}>
        <h1 style={{margin:'0 0 4px',fontSize:'22px',fontWeight:800,fontFamily:"'Segoe UI', sans-serif",color:'#0f172a'}}>Dashboard Overview</h1>
        <p style={{margin:0,color:'#64748b',fontSize:'14px'}}>Welcome back, Admin 👋</p>
      </div>

      {/* Stats grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',gap:'16px',marginBottom:'32px'}}>
        {STAT_CARDS.map(s => (
          <div key={s.label} style={{background:'#fff',borderRadius:'16px',padding:'20px 22px',border:'1px solid #e5e7eb',boxShadow:'0 2px 8px rgba(124,58,237,0.07)'}}>
            <div style={{fontSize:'24px',marginBottom:'8px'}}>{s.icon}</div>
            <div style={{fontSize:'26px',fontWeight:800,color:s.color,fontFamily:"'Segoe UI', sans-serif"}}>{s.value}</div>
            <div style={{fontSize:'12px',color:'#64748b',marginTop:'4px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        {/* Recent Appointments */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e5e7eb',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 style={{margin:0,fontSize:'15px',fontWeight:700,color:'#0f172a'}}>Recent Appointments</h2>
            <span style={{fontSize:'11px',color:'#94a3b8'}}>Last 10</span>
          </div>
          {stats?.recentAppointments?.length > 0 ? (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                <thead>
                  <tr style={{background:'#f8fafc'}}>
                    {['Patient','Doctor','Date','Status'].map(h => (
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f1f5f9'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAppointments.map(a => (
                    <tr key={a._id} style={{borderBottom:'1px solid #f8fafc'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{padding:'10px 14px',fontWeight:600,color:'#0f172a'}}>{a.patientName}</td>
                      <td style={{padding:'10px 14px',color:'#374151'}}>{a.doctorName}</td>
                      <td style={{padding:'10px 14px',color:'#374151',fontSize:'11px'}}>{a.date}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'2px 8px',borderRadius:'12px',fontSize:'10px',fontWeight:700,textTransform:'uppercase',background:STATUS_STYLES[a.status]?.bg||'#f3f4f6',color:STATUS_STYLES[a.status]?.color||'#374151'}}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{padding:'40px',textAlign:'center',color:'#94a3b8',fontSize:'13px'}}>No appointments yet.</div>
          )}
        </div>

        {/* Doctor Availability */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e5e7eb',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9'}}>
            <h2 style={{margin:0,fontSize:'15px',fontWeight:700,color:'#0f172a'}}>Doctor Availability</h2>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  {['Name','Speciality','Status'].map(h => (
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid #f1f5f9'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.doctors||[]).map(d => (
                  <tr key={d._id} style={{borderBottom:'1px solid #f8fafc'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <td style={{padding:'10px 14px',fontWeight:600,color:'#0f172a'}}>{d.name}</td>
                    <td style={{padding:'10px 14px',color:'#374151',fontSize:'11px'}}>{d.speciality}</td>
                    <td style={{padding:'10px 14px'}}>
                      <button onClick={() => handleToggle(d._id)} disabled={toggling===d._id} style={{
                        padding:'4px 12px',
                        background: d.available ? '#f5f3ff' : '#f3f4f6',
                        color: d.available ? PRIMARY : '#9ca3af',
                        border: `1px solid ${d.available ? '#ddd6fe' : '#e2e8f0'}`,
                        borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer',
                        opacity: toggling===d._id ? 0.5 : 1,
                      }}>
                        {toggling===d._id ? '…' : d.available ? '✓ Available' : '✗ Unavailable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
