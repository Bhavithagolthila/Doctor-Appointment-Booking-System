import { useState, useEffect, useRef } from 'react';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from '../api/admin';

const PRIMARY = '#7c3aed';

const STATUS_STYLES = {
  pending:   { bg: '#fef9ec', color: '#b45309',  label: 'Pending'   },
  confirmed: { bg: '#eff6ff', color: '#1d4ed8',  label: 'Confirmed' },
  completed: { bg: '#f0fdf4', color: '#15803d',  label: 'Completed' },
  cancelled: { bg: '#fff1f2', color: '#be123c',  label: 'Cancelled' },
};

const CANCEL_REASONS = [
  'Doctor unavailable',
  'Patient requested',
  'Emergency rescheduling',
  'Duplicate booking',
  'Other',
];

// Dropdown for confirmed appointments — shows Complete + Cancel with reason
function ActionDropdown({ appt, onStatusChange, updating }) {
  const [open, setOpen] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [reason, setReason] = useState('');
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) { setOpen(false); setShowReasonPicker(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen(o => !o);
  };

  const handleComplete = () => {
    onStatusChange(appt._id, 'completed');
    setOpen(false);
  };

  const handleCancelClick = () => {
    setShowReasonPicker(true);
    setOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!reason) return;
    onStatusChange(appt._id, 'cancelled', reason);
    setShowReasonPicker(false);
    setReason('');
  };

  if (showReasonPicker) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#be123c', marginBottom: '2px' }}>Reason for cancellation:</div>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ fontSize: '11px', padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', color: '#111', background: '#fff', cursor: 'pointer' }}
          autoFocus
        >
          <option value="">Select reason…</option>
          {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleConfirmCancel}
            disabled={!reason || updating}
            style={{ flex: 1, padding: '5px 8px', background: reason ? '#be123c' : '#f1f5f9', color: reason ? '#fff' : '#94a3b8', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: reason ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            Confirm Cancel
          </button>
          <button
            onClick={() => { setShowReasonPicker(false); setReason(''); }}
            style={{ padding: '5px 8px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={updating}
        style={{
          padding: '5px 12px',
          background: '#fff',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '7px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: 'inherit',
          opacity: updating ? 0.5 : 1,
        }}
      >
        Actions <span style={{ fontSize: '9px', color: '#9ca3af' }}>▼</span>
      </button>

      {open && (
        <div ref={ref} style={{
          position: 'fixed',
          top: dropPos.top,
          left: dropPos.left,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '170px',
          overflow: 'hidden',
        }}>
          <button
            onClick={handleComplete}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#15803d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ✓ Mark Complete
          </button>
          <div style={{ height: '1px', background: '#f1f5f9' }} />
          <button
            onClick={handleCancelClick}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#be123c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ✕ Cancel Appointment
          </button>
        </div>
      )}
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    getAllAppointments().then(setAppointments).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status, cancelReason = '') => {
    setUpdating(id);
    try {
      await updateAppointmentStatus(id, status, cancelReason);
      setAppointments(prev =>
        prev.map(a => a._id === id
          ? { ...a, status, cancelledBy: status === 'cancelled' ? 'admin' : null, cancelReason: status === 'cancelled' ? cancelReason : '' }
          : a
        )
      );
    } finally { setUpdating(null); }
  };

  const handleDelete = async (id, name) => {
    // Only allow deleting cancelled appointments
    const appt = appointments.find(a => a._id === id);
    if (appt && appt.status !== 'cancelled') return;
    if (!window.confirm(`Permanently delete this cancelled appointment for ${name}?`)) return;
    await deleteAppointment(id);
    setAppointments(prev => prev.filter(a => a._id !== id));
  };

  const filtered = appointments.filter(a => {
    const ms = !search || a.patientName?.toLowerCase().includes(search.toLowerCase()) || a.doctorName?.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === 'All' || a.status === statusFilter.toLowerCase();
    return ms && mf;
  });

  return (
    <div style={{ padding: '28px', fontFamily: "'Segoe UI', sans-serif", background: '#f9fafb', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#111' }}>Appointments</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Manage and update appointment statuses</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>🔍</span>
          <input
            placeholder="Search patient or doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 32px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontSize: '13px', fontFamily: 'inherit', background: '#fff',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = PRIMARY}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 13px',
              background: statusFilter === s ? PRIMARY : '#fff',
              color: statusFilter === s ? '#fff' : '#374151',
              border: `1px solid ${statusFilter === s ? PRIMARY : '#e5e7eb'}`,
              borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{s}</button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{filtered.length} records</span>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['#', 'Patient', 'Doctor', 'Date & Time', '₹Fee', 'Payment', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr
                    key={a._id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 10px', fontSize: '11px', color: '#9ca3af' }}>#{i + 1}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.patientName}</td>
                    <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.doctorName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.speciality}</div>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: '11px', color: '#374151' }}>
                      <div>{a.date}</div>
                      <div style={{ color: '#9ca3af' }}>{a.time}</div>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: PRIMARY }}>₹{a.fee || '—'}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
                          background: a.paymentStatus === 'paid' ? '#eff6ff' : '#fef9ec',
                          color: a.paymentStatus === 'paid' ? '#1d4ed8' : '#b45309',
                          fontWeight: 600, display: 'inline-block', width: 'fit-content',
                        }}>
                          {a.paymentMethod || '—'}
                        </span>
                        {/* FIX: this is a demo payment system with no real gateway —
                            "Refund Initiated" read like a real financial action was
                            taken. Relabeled to make clear it's a demo/simulated
                            refund, not an actual money movement. */}
                        {a.status === 'cancelled' && a.cancelledBy === 'admin' && a.paymentStatus === 'paid' && (
                          <span style={{
                            fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                            background: '#fef3c7', color: '#d97706',
                            fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content',
                          }}>
                            💸 Demo Refund (no real charge)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '20px',
                          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          background: STATUS_STYLES[a.status]?.bg || '#f3f4f6',
                          color: STATUS_STYLES[a.status]?.color || '#374151',
                          display: 'inline-block', width: 'fit-content',
                        }}>
                          {STATUS_STYLES[a.status]?.label || a.status}
                        </span>
                        {/* Show who cancelled + reason */}
                        {a.status === 'cancelled' && a.cancelledBy && (
                          <span style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {a.cancelledBy === 'user' ? '👤 By patient' : '🛡 By admin'}
                            {a.cancelReason ? ` · ${a.cancelReason}` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Pending: Confirm or Cancel */}
                        {a.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatus(a._id, 'confirmed')}
                              disabled={updating === a._id}
                              style={{ padding: '5px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: updating === a._id ? 0.5 : 1 }}
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={() => handleStatus(a._id, 'cancelled', 'Admin decision')}
                              disabled={updating === a._id}
                              style={{ padding: '5px 10px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: updating === a._id ? 0.5 : 1 }}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}

                        {/* Confirmed: dropdown with Complete or Cancel-with-reason */}
                        {a.status === 'confirmed' && (
                          <ActionDropdown appt={a} onStatusChange={handleStatus} updating={updating === a._id} />
                        )}

                        {/* Completed: locked, cannot delete */}
                        {a.status === 'completed' && (
                          <span style={{ fontSize: '11px', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span title="Completed appointments cannot be deleted">🔒 Locked</span>
                          </span>
                        )}

                        {/* Cancelled: delete only */}
                        {a.status === 'cancelled' && (
                          <button
                            onClick={() => handleDelete(a._id, a.patientName)}
                            style={{ padding: '5px 8px', background: '#fff', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
                            title="Delete cancelled appointment"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No appointments found.</div>
          )}
        </div>
      )}
    </div>
  );
}
