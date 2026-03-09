import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, User, CheckCircle2, ChevronRight, X, RefreshCw } from 'lucide-react';

const SLOTS = ['9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];

function getMinDate() {
  const d = new Date(); d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
}

export default function Appointments({ role }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const type = role || user?.role || 'consumer';

  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  useEffect(() => {
    axios.get('/api/appointments').then(r => setAppointments(r.data));
  }, []);

  const book = async () => {
    if (!date || !slot) { addToast('Please select a date and slot', 'error'); return; }
    setLoading(true);
    try {
      const r = await axios.post('/api/appointments', { date, slot, type, notes });
      setAppointments(prev => [...prev, r.data]);
      setDate(''); setSlot(''); setNotes('');
      addToast(`📅 Appointment booked! Engineer: ${r.data.engineer}`);
    } catch { addToast('Booking failed', 'error'); }
    finally { setLoading(false); }
  };

  const advance = async (id) => {
    const r = await axios.post(`/api/appointments/${id}/advance`);
    setAppointments(prev => prev.map(a => a.id === id ? r.data : a));
    const step = r.data.steps[r.data.step];
    addToast(`✅ Status updated: ${step.label}`);
  };

  const reschedule = async (id) => {
    if (!rescheduleDate || !rescheduleSlot) { addToast('Select new date and slot', 'error'); return; }
    const r = await axios.post(`/api/appointments/${id}/reschedule`, { date: rescheduleDate, slot: rescheduleSlot });
    setAppointments(prev => prev.map(a => a.id === id ? r.data : a));
    setRescheduleId(null);
    addToast('📅 Appointment rescheduled!');
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await axios.delete(`/api/appointments/${id}`);
    setAppointments(prev => prev.filter(a => a.id !== id));
    addToast('Appointment cancelled');
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Appointments</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Schedule site surveys, installations, and maintenance visits</p>
      </div>

      {/* DISCOM Timeline Info */}
      <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.7 }}>
        <strong style={{ color: '#00d4aa' }}>📋 What to expect after booking:</strong> Site survey in 3–5 days → VoltGrid files DISCOM application → Technical feasibility review (2–4 weeks) → Net meter issued (4–6 weeks) → Panel installation (6–7 weeks) → Inspection clearance → <strong style={{ color: '#22c55e' }}>System Live! (~8–10 weeks total)</strong>
      </div>

      {/* Book Form */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#00d4aa" /> Book Appointment
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Date</label>
            <input type="date" min={getMinDate()} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Time Slot</label>
            <select value={slot} onChange={e => setSlot(e.target.value)}>
              <option value="">Select slot</option>
              {SLOTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', display: 'block' }}>Notes for engineer (optional)</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Building has terrace access code: 4521. Parking available." />
        </div>
        <button onClick={book} disabled={loading} style={{ background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', fontWeight: 700, borderRadius: '10px', padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <Calendar size={15} /> {loading ? 'Booking…' : 'Confirm Appointment'}
        </button>
      </div>

      {/* Appointments List */}
      {appointments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {appointments.map(appt => {
            const isRescheduling = rescheduleId === appt.id;
            return (
              <div key={appt.id} className="glass-card">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                        <Calendar size={13} color="#00d4aa" /> {appt.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                        <Clock size={13} color="#00d4aa" /> {appt.slot}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                        <MapPin size={13} color="#00d4aa" /> {appt.serviceCenter}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                        <User size={13} color="#00d4aa" /> {appt.engineer}
                      </div>
                    </div>
                    {appt.notes && <div style={{ fontSize: '0.72rem', color: '#4a6080', fontStyle: 'italic' }}>Note: {appt.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setRescheduleId(isRescheduling ? null : appt.id)} style={{ background: 'transparent', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600 }}>
                      <RefreshCw size={11} /> Reschedule
                    </button>
                    <button onClick={() => cancel(appt.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem' }}>
                      <X size={11} />
                    </button>
                  </div>
                </div>

                {/* Reschedule panel */}
                {isRescheduling && (
                  <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', display: 'block' }}>New Date</label>
                      <input type="date" min={getMinDate()} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }} />
                    </div>
                    <div style={{ flex: '2 1 180px' }}>
                      <label style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem', display: 'block' }}>New Slot</label>
                      <select value={rescheduleSlot} onChange={e => setRescheduleSlot(e.target.value)} style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}>
                        <option value="">Select</option>
                        {SLOTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <button onClick={() => reschedule(appt.id)} style={{ background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      Confirm Reschedule
                    </button>
                  </div>
                )}

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                  {appt.steps.map((step, i) => {
                    const done = i < appt.step;
                    const active = i === appt.step;
                    const color = done ? '#22c55e' : active ? '#00d4aa' : '#1e3a5f';
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.875rem', paddingBottom: i < appt.steps.length - 1 ? '0.6rem' : 0, position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#22c55e' : active ? '#00d4aa' : '#1e3a5f', boxShadow: active ? '0 0 12px #00d4aa60' : 'none', transition: 'all 0.3s', flexShrink: 0 }}>
                            {done ? <CheckCircle2 size={12} color="#0a0f1e" /> : <span style={{ fontSize: '0.6rem', fontWeight: 700, color: active ? '#0a0f1e' : '#4a6080' }}>{i + 1}</span>}
                          </div>
                          {i < appt.steps.length - 1 && (
                            <div style={{ width: '2px', flex: 1, minHeight: '20px', background: done ? '#22c55e' : '#1e3a5f', transition: 'background 0.3s' }} />
                          )}
                        </div>
                        <div style={{ paddingTop: '2px', paddingBottom: '0.75rem', flex: 1 }}>
                          <div style={{ fontWeight: active ? 700 : done ? 600 : 400, fontSize: '0.82rem', color: done ? '#22c55e' : active ? '#e2e8f0' : '#4a6080' }}>{step.label}</div>
                          <div style={{ fontSize: '0.68rem', color: '#4a6080', marginTop: '0.1rem' }}>{step.detail} {step.eta && <span style={{ color: active ? '#00d4aa' : '#4a6080', fontWeight: 500 }}>· ETA: {step.eta}</span>}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {appt.step < appt.steps.length - 1 && (
                  <button onClick={() => advance(appt.id)} style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid rgba(0,212,170,0.25)', color: '#00d4aa', padding: '0.45rem 0.875rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    Advance Status (Demo) <ChevronRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {appointments.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
          <Calendar size={32} color="#1e3a5f" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>No appointments yet</div>
          <div style={{ fontSize: '0.82rem' }}>Book a site survey above to begin the DISCOM process</div>
        </div>
      )}
    </div>
  );
}
