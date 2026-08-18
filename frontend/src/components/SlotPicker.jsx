import { useState, useEffect } from 'react';
import { getBookedSlots } from '../api/appointments';

const PRIMARY = '#7c3aed';
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TIME_SLOTS = [
  { label: 'Morning', slots: ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM'] },
  { label: 'Afternoon', slots: ['12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM'] },
  { label: 'Evening', slots: ['03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM','05:30 PM'] },
];

function timeToValue(t) {
  // "09:00 AM" -> "09:00"
  const [time, period] = t.split(' ');
  const [h, m] = time.split(':').map(Number);
  const h24 = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
  return `${String(h24).padStart(2,'0')}:${m === 0 ? '00' : String(m)}`;
}

export default function SlotPicker({ doctorId, selectedDate, setSelectedDate, selectedTime, setSelectedTime }) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ── FIX: grey out slots that are already booked for this doctor/date ──
  const [bookedTimes, setBookedTimes] = useState([]);
  useEffect(() => {
    if (!doctorId || !selectedDate) { setBookedTimes([]); return; }
    let cancelled = false;
    getBookedSlots(doctorId, selectedDate).then(times => {
      if (!cancelled) setBookedTimes(times || []);
    });
    return () => { cancelled = true; };
  }, [doctorId, selectedDate]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, cur: false });

  // ── FIX 6: build the ISO date string from local Y/M/D components ──
  // (toISOString() converts to UTC first, which shifts the date back a day
  // for any timezone ahead of UTC — e.g. India (UTC+5:30) — so clicking
  // "20" could silently book the 19th. Building the string manually keeps
  // the date the user actually clicked.)
  const isoDate = (day) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // FIX: past dates were already disabled in the calendar, but time slots
  // that had already passed *today* were still shown as bookable. Compute
  // the current "HH:MM" once so we can grey out any slot at or before now
  // when today is the selected date.
  const nowHM = (() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  })();

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < today || d.getDay() === 0; // disable past + Sundays
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDate = (day, cur) => {
    if (!cur || isDisabled(day)) return;
    setSelectedDate(isoDate(day));
    setSelectedTime('');
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  const displayDate = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Calendar */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>📅 Select Date</div>
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', background: '#fff', maxWidth: '280px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{MONTHS[viewMonth]}, {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '6px 6px 0' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#9ca3af', padding: '3px 0' }}>{d}</div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '3px 6px 8px', gap: '1px' }}>
            {cells.map((c, i) => {
              const iso = c.cur ? isoDate(c.day) : null;
              const disabled = !c.cur || isDisabled(c.day);
              const isSelected = iso === selectedDate;
              const isToday = c.cur && iso === todayIso;
              return (
                <button key={i} onClick={() => selectDate(c.day, c.cur)} disabled={disabled}
                  style={{
                    width: '100%', aspectRatio: '1', border: 'none', borderRadius: '6px',
                    fontSize: '11px', fontWeight: isSelected || isToday ? 700 : 400, cursor: disabled ? 'default' : 'pointer',
                    background: isSelected ? PRIMARY : isToday ? '#ede9fe' : 'transparent',
                    color: isSelected ? '#fff' : !c.cur ? '#d1d5db' : disabled ? '#d1d5db' : '#111',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!disabled && !isSelected) e.currentTarget.style.background = '#f5f3ff'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#ede9fe' : 'transparent'; }}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </div>

        {displayDate && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: PRIMARY, fontWeight: 600 }}>
            Selected: {displayDate}
          </div>
        )}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>⏰ Select Time Slot</div>
          {TIME_SLOTS.map(({ label, slots }) => (
            <div key={label} style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {slots.map(slot => {
                  const val = timeToValue(slot);
                  const isActive = selectedTime === val;
                  const isPast = selectedDate === todayIso && val <= nowHM;
                  const isBooked = bookedTimes.includes(val) || isPast;
                  return (
                    <button key={slot} onClick={() => { if (!isBooked) setSelectedTime(val); }} disabled={isBooked}
                      title={isPast ? 'This time has already passed today' : isBooked ? 'This slot is already booked' : undefined}
                      style={{
                        padding: '8px 14px', border: `1.5px solid ${isActive ? PRIMARY : isBooked ? '#f1f5f9' : '#e5e7eb'}`,
                        borderRadius: '10px', fontSize: '13px', fontWeight: isActive ? 700 : 500,
                        cursor: isBooked ? 'not-allowed' : 'pointer', background: isActive ? PRIMARY : isBooked ? '#f8fafc' : '#fff',
                        color: isActive ? '#fff' : isBooked ? '#cbd5e1' : '#374151', transition: 'all 0.15s',
                        textDecoration: isBooked ? 'line-through' : 'none',
                      }}
                      onMouseEnter={e => { if (!isActive && !isBooked) { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; } }}
                      onMouseLeave={e => { if (!isActive && !isBooked) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; } }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {selectedDate && selectedTime && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '12px', padding: '14px 16px', fontSize: '14px', color: PRIMARY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ {displayDate} &nbsp;·&nbsp; {TIME_SLOTS.flatMap(g => g.slots).find(s => timeToValue(s) === selectedTime) || selectedTime}
        </div>
      )}
    </div>
  );
}
