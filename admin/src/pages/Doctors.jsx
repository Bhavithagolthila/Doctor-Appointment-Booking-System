import { useState, useEffect } from 'react';
import { getAllDoctors, toggleDoctorAvailability, addDoctor, updateDoctor, deleteDoctor } from '../api/admin';
import { resolveImageUrl } from '../utils/imageUrl';

const PRIMARY = '#7c3aed';
const SPECS = ['General Physician','Gynecologist','Dermatologist','Pediatricians','Neurologist','Gastroenterologist'];

const EMPTY_FORM = { name:'', speciality:'', degree:'MBBS', experience:'', fee:'', available:true, about:'', location:'' };

export default function Doctors() {
  const [doctors, setDoctors]   = useState([]);
  const [filter, setFilter]     = useState('All');
  const [showAdd, setShowAdd]   = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast]       = useState('');
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formErr, setFormErr]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  // FIX: the backend already supported PATCH/DELETE /api/admin/doctors/:id
  // (updateDoctor / deleteDoctor already existed in api/admin.js), but this
  // page only ever called addDoctor and toggleDoctorAvailability — there
  // was no way to actually edit a doctor's details or remove one.
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { getAllDoctors().then(setDoctors).catch(console.error); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      const updated = await toggleDoctorAvailability(id);
      setDoctors(prev => prev.map(d => d._id === id ? updated : d));
      showToast(`Status updated!`);
    } catch(e) { console.error(e); } finally { setToggling(null); }
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.speciality) e.speciality = 'Speciality required';
    if (!form.fee || isNaN(form.fee) || Number(form.fee) < 100) e.fee = 'Enter valid fee (min ₹100)';
    return e;
  };

  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({
      name: d.name || '', speciality: d.speciality || '', degree: d.degree || 'MBBS',
      experience: d.experience || '', fee: String(d.fee ?? ''), available: d.available !== false,
      about: d.about || '', location: d.location || '',
    });
    setPhotoPreview(d.image ? resolveImageUrl(d.image) : '');
    setPhotoFile(null);
    setFormErr({});
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErr({});
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setSaving(true);
    try {
      if (editingId) {
        // FIX: editing currently updates text fields only — changing the
        // photo on an existing doctor still requires re-adding, since the
        // PATCH endpoint (updateDoctor) accepts JSON, not multipart. This
        // is a known limitation, noted in the final report.
        const updated = await updateDoctor(editingId, { ...form, fee: Number(form.fee) });
        setDoctors(prev => prev.map(d => d._id === editingId ? updated : d));
        showToast('Doctor updated successfully!');
      } else {
        const payload = { ...form, fee: Number(form.fee) };
        if (photoFile) payload.image = photoFile;
        const doc = await addDoctor(payload);
        setDoctors(prev => [...prev, doc]);
        showToast('Doctor added successfully!');
      }
      closeModal();
    } catch(err) { setFormErr({ api: err.response?.data?.message || err.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete ${d.name}? This cannot be undone. Existing appointment records will keep their own copy of this doctor's details.`)) return;
    setDeleting(d._id);
    try {
      await deleteDoctor(d._id);
      setDoctors(prev => prev.filter(x => x._id !== d._id));
      showToast('Doctor deleted.');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete doctor.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === 'All' ? doctors
    : filter === 'Available' ? doctors.filter(d => d.available)
    : doctors.filter(d => !d.available);

  const inp = (key) => ({
    width: '100%', padding: '9px 12px', border: `1.5px solid ${formErr[key] ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '8px', fontSize: '13px', fontFamily: 'system-ui', outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div style={{ padding: '28px', fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100%' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: PRIMARY, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>✓ {toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, fontFamily: 'Georgia, serif', color: '#0f172a' }}>Doctors</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{doctors.filter(d => d.available).length} available · {doctors.filter(d => !d.available).length} unavailable</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowAdd(true); }} style={{ padding: '10px 20px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          + Add Doctor
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['All','Available','Unavailable'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', background: filter === f ? PRIMARY : '#fff', color: filter === f ? '#fff' : '#374151', border: '1px solid', borderColor: filter === f ? PRIMARY : '#e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {filtered.map(d => (
          <div key={d._id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ height: '130px', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {d.image ? (
                <img
                  src={resolveImageUrl(d.image)}
                  alt={d.name}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                />
              ) : null}
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: PRIMARY, display: d.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: 'Georgia, serif' }}>
                {d.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
              </div>
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: d.available ? '#dcfce7' : '#f3f4f6', color: d.available ? '#16a34a' : '#9ca3af', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>
                {d.available ? '● Available' : '● Unavailable'}
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '2px', fontFamily: 'Georgia, serif' }}>{d.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{d.speciality}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>{d.experience} · {d.degree}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: PRIMARY }}>₹{d.fee}/visit</span>
                <button onClick={() => handleToggle(d._id)} disabled={toggling === d._id} style={{ padding: '5px 12px', background: d.available ? '#fef2f2' : '#f0fdf4', color: d.available ? '#dc2626' : '#16a34a', border: `1px solid ${d.available ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: toggling === d._id ? 'not-allowed' : 'pointer' }}>
                  {toggling === d._id ? '…' : d.available ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(d)} style={{ flex: 1, padding: '6px 10px', background: '#f5f3ff', color: PRIMARY, border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                  ✎ Edit
                </button>
                <button onClick={() => handleDelete(d)} disabled={deleting === d._id} style={{ flex: 1, padding: '6px 10px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: deleting === d._id ? 'not-allowed' : 'pointer', opacity: deleting === d._id ? 0.6 : 1 }}>
                  {deleting === d._id ? '…' : '🗑 Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '14px' }}>No doctors found.</div>}

      {/* Add Doctor Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'Georgia, serif' }}>{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              {/* Photo Upload — only for new doctors; editing an existing photo
                  isn't supported yet since the edit endpoint accepts JSON, not
                  multipart (see note in handleSave). */}
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: photoPreview ? 'transparent' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2.5px dashed ${PRIMARY}`, cursor: editingId ? 'default' : 'pointer', flexShrink: 0 }}
                  onClick={() => !editingId && document.getElementById('doctor-photo-input').click()}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '28px' }}>📷</span>}
                </div>
                {!editingId && (
                  <>
                    <input id="doctor-photo-input" type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }} />
                    <button type="button" onClick={() => document.getElementById('doctor-photo-input').click()}
                      style={{ fontSize: '12px', color: PRIMARY, background: '#ede9fe', border: 'none', borderRadius: '8px', padding: '5px 14px', fontWeight: 600, cursor: 'pointer' }}>
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {photoPreview && (
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                        style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Remove
                      </button>
                    )}
                  </>
                )}
                {editingId && <div style={{ fontSize: '11px', color: '#94a3b8' }}>Photo can't be changed here — delete and re-add to change it.</div>}
              </div>
              {[
                { label:'Full Name', key:'name', type:'text', placeholder:'Dr. John Smith' },
                { label:'Degree', key:'degree', type:'text', placeholder:'MBBS, MD...' },
                { label:'Experience', key:'experience', type:'text', placeholder:'5 Years' },
                { label:'Consultation Fee (₹)', key:'fee', type:'number', placeholder:'500' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                    onChange={e => { setForm(p => ({...p, [f.key]: e.target.value})); setFormErr(p => ({...p, [f.key]: ''})); }}
                    style={inp(f.key)}
                    onFocus={e => e.target.style.borderColor = PRIMARY}
                    onBlur={e => e.target.style.borderColor = formErr[f.key] ? '#ef4444' : '#e2e8f0'}
                  />
                  {formErr[f.key] && <p style={{ color: '#ef4444', fontSize: '11px', margin: '3px 0 0' }}>{formErr[f.key]}</p>}
                </div>
              ))}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Speciality</label>
                <select value={form.speciality} onChange={e => { setForm(p => ({...p, speciality: e.target.value})); setFormErr(p => ({...p, speciality:''})); }}
                  style={{ ...inp('speciality'), cursor: 'pointer' }}>
                  <option value="">Select speciality</option>
                  {SPECS.map(s => <option key={s}>{s}</option>)}
                </select>
                {formErr.speciality && <p style={{ color: '#ef4444', fontSize: '11px', margin: '3px 0 0' }}>{formErr.speciality}</p>}
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="avail" checked={form.available} onChange={e => setForm(p => ({...p, available: e.target.checked}))} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: PRIMARY }} />
                <label htmlFor="avail" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Available for appointments</label>
              </div>
              {formErr.api && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#dc2626', marginBottom: '16px' }}>{formErr.api}</div>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.75 : 1 }}>
                  {saving ? (editingId ? 'Saving…' : 'Adding…') : (editingId ? 'Save Changes' : 'Add Doctor')}
                </button>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
