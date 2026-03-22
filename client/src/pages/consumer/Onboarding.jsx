import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Zap, Sun, MapPin, Star, ChevronRight, CheckCircle2, Gift, Cpu, Upload, Car } from 'lucide-react';

const STATES = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Telangana','Andhra Pradesh','Uttar Pradesh','West Bengal','Madhya Pradesh','Kerala','Punjab','Haryana','Bihar','Other'];
const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Jaipur','Kolkata','Lucknow','Ahmedabad','Other'];

const HOME_TYPES = [
  { id: 'apartment', label: '🏢 Apartment', sub: 'Flat in multi-storey' },
  { id: 'house',     label: '🏠 Independent House', sub: 'Own rooftop available' },
  { id: 'villa',     label: '🏡 Villa / Bungalow', sub: 'Large rooftop + garden' },
  { id: 'rwa',       label: '🏘️ Society / RWA', sub: 'Representing a complex' },
  { id: 'commercial',label: '🏪 Commercial', sub: 'Shop/Office/SME' },
];

const APPLIANCES = [
  { id: 'ac', label: 'AC (1.5 ton)', daily: 6 }, { id: 'wh', label: 'Water Heater', daily: 1.5 },
  { id: 'fridge', label: 'Refrigerator', daily: 1.5 }, { id: 'washing', label: 'Washing Machine', daily: 0.8 },
  { id: 'lights', label: 'Lights / Fans', daily: 2 }, { id: 'tv', label: 'TV & Entertainment', daily: 1 },
];

const GOALS = [
  { id: 'savings', label: '💰 Maximum Savings', sub: 'Lowest net electricity cost' },
  { id: 'backup',  label: '🔋 Power Backup', sub: 'Uninterrupted supply during outages' },
  { id: 'green',   label: '🌿 Go Green', sub: 'Reduce my carbon footprint' },
  { id: 'ev',      label: '⚡ EV Charging', sub: 'Power my electric vehicle on solar' },
];

export default function ConsumerOnboarding() {
  const { refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ homeType: '', state: '', city: '', bill: '', kwh: '', billMode: 'rupees', appliances: [], backupHours: 4, goal: '', acCount: 1, hasEV: false, evModel: '', batteryCapacity: '', chargerType: '', dailyKm: 50, chargingTime: '' });
  const [stateData, setStateData] = useState(null);
  const [subsidy, setSubsidy] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 5 — data source selection
  const [dataSource, setDataSource] = useState(null); // 'iot' | 'smartmeter' | 'manual'
  const [smSubOption, setSmSubOption] = useState('gov'); // 'gov' | 'portal'
  const [smForm, setSmForm] = useState({ caNumber:'', discom:'', authChecked:false, username:'', password:'', showPw:false });
  const [smStatus, setSmStatus] = useState(null); // null | 'loading' | 'success'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'processing' | 'done'
  const [helpExpanded, setHelpExpanded] = useState(false);

  const canProceed = dataSource === 'iot' || (dataSource === 'smartmeter' && smStatus === 'success') || (dataSource === 'manual' && uploadStatus === 'done');

  useEffect(() => {
    if (form.state) {
      axios.get(`/api/state/${form.state}`).then(r => setStateData(r.data)).catch(() => {});
    }
  }, [form.state]);

  const estimatedKwh = () => {
    if (form.billMode === 'kwh' && form.kwh) return parseFloat(form.kwh);
    if (form.bill) return Math.floor(parseFloat(form.bill) / (stateData?.avgTariff || 7));
    const base = form.appliances.reduce((a, id) => a + (APPLIANCES.find(x => x.id === id)?.daily || 0), 0);
    return +(base * 30).toFixed(0);
  };

  const getRecommendation = () => {
    const kwh = estimatedKwh();
    const homeType = form.homeType;
    if (homeType === 'rwa') return { planId: 'society', reason: 'Group plan designed for housing societies', capacityKw: 30 };
    if (kwh > 300 || form.goal === 'backup' || homeType === 'villa') return { planId: 'hybrid', reason: 'Your usage + backup need → Hybrid Pro', capacityKw: 8 };
    if (kwh > 150 || homeType === 'house') return { planId: 'rooftop', reason: 'On-site rooftop is most cost-effective for you', capacityKw: 5 };
    if (stateData?.vnm) return { planId: 'virtual', reason: 'Virtual Solar is available in your state', capacityKw: 3 };
    return { planId: 'rooftop', reason: 'Virtual Solar not yet available in your state — Rooftop recommended', capacityKw: 5 };
  };

  const calcSubsidy = async (rec) => {
    try {
      const r = await axios.post('/api/subsidy/calculate', { capacityKw: rec.capacityKw, homeType: form.homeType });
      setSubsidy(r.data);
    } catch {}
  };

  const handleNext = async () => {
    if (step === 0 && !form.homeType) { addToast('Please select your home type', 'error'); return; }
    if (step === 1 && !form.state) { addToast('Please select your state', 'error'); return; }
    if (step === 3) {
      const rec = getRecommendation();
      setRecommendation(rec);
      await calcSubsidy(rec);
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (planId) => {
    setLoading(true);
    try {
      await axios.post('/api/consumer/onboard', { ...form, state: form.state, homeType: form.homeType, city: form.city });
      await axios.post('/api/consumer/subscribe', { planId: planId || recommendation?.planId });
      await refreshUser();
      addToast('🎉 Welcome to VoltGrid! Your installation is being scheduled.', 'success');
      navigate('/dashboard');
    } catch { addToast('Something went wrong', 'error'); }
    finally { setLoading(false); }
  };

  const stepTitles = ['Home Type', 'Location & State', 'Energy Audit', 'Your Needs', 'Your Plan', 'Data Source'];
  const progress = ((step) / (stepTitles.length - 1)) * 100;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', paddingTop: '5rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.07) 0%, #0a0f1e 60%)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            {stepTitles.map((t, i) => (
              <div key={t} style={{ fontSize: '0.65rem', color: i <= step ? '#00d4aa' : '#2d4a6b', fontWeight: i === step ? 700 : 400, textAlign: 'center', flex: 1 }}>{t}</div>
            ))}
          </div>
          <div style={{ height: '4px', background: '#1e2d45', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #00d4aa, #22c55e)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Step 0: Home Type */}
        {step === 0 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>What type of home are you from?</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>This helps us recommend the right solar solution</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {HOME_TYPES.map(ht => (
                <button key={ht.id} onClick={() => setForm({ ...form, homeType: ht.id })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '12px', border: `2px solid ${form.homeType === ht.id ? '#00d4aa' : '#1e3a5f'}`, background: form.homeType === ht.id ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '0.15rem' }}>{ht.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ht.sub}</div>
                  </div>
                  {form.homeType === ht.id && <CheckCircle2 size={20} color="#00d4aa" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: State & City */}
        {step === 1 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Where are you located?</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Solar plan availability and savings vary by state</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap:'0.4rem' }}><MapPin size={14} color="#00d4aa" /> State</label>
                <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {stateData && (
                <div style={{ background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#00d4aa', fontWeight: 700, marginBottom: '0.5rem' }}>Your state: {form.state}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                    <div style={{ color: '#64748b' }}>DISCOM: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{stateData.discom}</span></div>
                    <div style={{ color: '#64748b' }}>Avg Tariff: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{stateData.avgTariff}/kWh</span></div>
                    <div style={{ color: '#64748b' }}>Feed-in Rate: <span style={{ color: '#22c55e', fontWeight: 700 }}>₹{stateData.fit}/kWh</span></div>
                    <div style={{ color: '#64748b' }}>Virtual Solar: <span style={{ color: stateData.vnm ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{stateData.vnm ? '✅ Available' : '❌ Not yet'}</span></div>
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap:'0.4rem' }}><MapPin size={14} color="#00d4aa" /> City</label>
                <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Energy Audit */}
        {step === 2 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Let's size your system</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Tell us about your energy usage — we'll find the right plan</p>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.25rem', border: '1px solid #1e3a5f', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>
                Monthly electricity bill <span style={{ color: '#4a6080' }}>(or switch to units)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['rupees','kwh'].map(m => (
                  <button key={m} onClick={() => setForm({...form, billMode: m})} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', border: `1px solid ${form.billMode===m ? '#00d4aa' : '#1e3a5f'}`, background: form.billMode===m ? 'rgba(0,212,170,0.1)' : 'transparent', color: form.billMode===m ? '#00d4aa' : '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                    {m === 'rupees' ? '₹ Rupees' : 'kWh Units'}
                  </button>
                ))}
              </div>
              {form.billMode === 'rupees'
                ? <input type="number" placeholder="e.g. 3500" value={form.bill} onChange={e => setForm({...form, bill: e.target.value})} min="0" />
                : <input type="number" placeholder="e.g. 350" value={form.kwh} onChange={e => setForm({...form, kwh: e.target.value})} min="0" />
              }
              {estimatedKwh() > 0 && <div style={{ fontSize: '0.75rem', color: '#00d4aa', marginTop: '0.5rem' }}>≈ {estimatedKwh()} kWh/month estimated</div>}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>Which appliances do you use daily? (optional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {APPLIANCES.map(a => {
                  const sel = form.appliances.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => setForm({ ...form, appliances: sel ? form.appliances.filter(x => x !== a.id) : [...form.appliances, a.id] })} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: `1px solid ${sel ? '#00d4aa' : '#1e3a5f'}`, background: sel ? 'rgba(0,212,170,0.08)' : 'transparent', color: sel ? '#00d4aa' : '#64748b', fontSize: '0.78rem', fontWeight: sel ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}>
                      {a.label} <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{a.daily}kWh/d</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.appliances.includes('ac') && (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>How many ACs?</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[1,2,3,4].map(n => (
                    <button key={n} onClick={() => setForm({...form, acCount: n})} style={{ width: '44px', height: '44px', borderRadius: '8px', border: `1px solid ${form.acCount===n ? '#00d4aa' : '#1e3a5f'}`, background: form.acCount===n ? 'rgba(0,212,170,0.1)' : 'transparent', color: form.acCount===n ? '#00d4aa' : '#64748b', fontWeight: 700, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>What matters most to you?</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>We'll tailor your plan recommendation to your priority</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setForm({ ...form, goal: g.id })} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '12px', border: `2px solid ${form.goal === g.id ? '#00d4aa' : '#1e3a5f'}`, background: form.goal === g.id ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '0.15rem' }}>{g.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.sub}</div>
                  </div>
                  {form.goal === g.id && <CheckCircle2 size={20} color="#00d4aa" />}
                </button>
              ))}
            </div>

            {/* EV Section */}
            <style>{`@keyframes vg-slideDown { from { max-height:0; opacity:0; } to { max-height:600px; opacity:1; } }`}</style>
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #1e3a5f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <Car size={16} color="#00d4aa" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>Electric Vehicle</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '0.6rem' }}>Do you own an Electric Vehicle?</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {[{ id: true, label: 'Yes' }, { id: false, label: 'No' }].map(opt => (
                  <button key={String(opt.id)} onClick={() => setForm({ ...form, hasEV: opt.id })} style={{ padding: '0.45rem 1.25rem', borderRadius: '20px', border: `1px solid ${form.hasEV === opt.id ? '#00d4aa' : '#1e3a5f'}`, background: form.hasEV === opt.id ? 'rgba(0,212,170,0.12)' : 'transparent', color: form.hasEV === opt.id ? '#00d4aa' : '#64748b', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{opt.label}</button>
                ))}
              </div>

              {form.hasEV && (
                <div style={{ animation: 'vg-slideDown 0.35s ease-out', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: '12px', padding: '1.1rem' }}>
                  {/* Vehicle Model */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Vehicle Model</label>
                    <input placeholder="e.g. Tata Nexon EV, MG ZS EV, Ather 450X" value={form.evModel} onChange={e => setForm({ ...form, evModel: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {/* Battery Capacity */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Battery Capacity</label>
                    <select value={form.batteryCapacity} onChange={e => setForm({ ...form, batteryCapacity: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1829', color: form.batteryCapacity ? '#e2e8f0' : '#64748b', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="">Select battery size</option>
                      {['Under 10 kWh','10–30 kWh','30–60 kWh','Above 60 kWh'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  {/* Charger Type */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Charger Type at Home</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[['slow','Slow AC (3.3 kW)'],['fast','Fast AC (7.4 kW)'],['dc','DC Fast (22 kW+)']].map(([id, label]) => (
                        <button key={id} onClick={() => setForm({ ...form, chargerType: id })} style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', border: `1px solid ${form.chargerType === id ? '#00d4aa' : '#1e3a5f'}`, background: form.chargerType === id ? 'rgba(0,212,170,0.12)' : 'transparent', color: form.chargerType === id ? '#00d4aa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {/* Daily Usage Slider */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Daily Usage</span>
                      <span style={{ color: '#00d4aa', fontWeight: 700 }}>{form.dailyKm} km</span>
                    </label>
                    <input type="range" min={10} max={200} step={10} value={form.dailyKm} onChange={e => setForm({ ...form, dailyKm: Number(e.target.value) })} style={{ width: '100%', accentColor: '#00d4aa' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#4a6080' }}><span>10 km</span><span>200 km</span></div>
                  </div>
                  {/* Preferred Charging Time */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>Preferred Charging Time</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[['morning','Morning (6–10 AM)'],['afternoon','Afternoon (11 AM–3 PM)'],['evening','Evening (4–8 PM)'],['night','Night (9 PM–6 AM)']].map(([id, label]) => (
                        <button key={id} onClick={() => setForm({ ...form, chargingTime: id })} style={{ padding: '0.4rem 0.75rem', borderRadius: '20px', border: `1px solid ${form.chargingTime === id ? '#00d4aa' : '#1e3a5f'}`, background: form.chargingTime === id ? 'rgba(0,212,170,0.12)' : 'transparent', color: form.chargingTime === id ? '#00d4aa' : '#64748b', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {label}
                          {id === 'afternoon' && <span style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>☀️ Solar Peak</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Recommendation */}
        {step === 4 && recommendation && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.25rem' }}>Your Perfect Plan ✨</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{recommendation.reason}</p>

            <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(34,197,94,0.06))', border: '2px solid rgba(0,212,170,0.4)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 0 32px rgba(0,212,170,0.12)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#00d4aa', marginBottom: '1rem' }}>
                {{ virtual:'Virtual Solar',rooftop:'Rooftop Solar',hybrid:'Hybrid Pro',society:'Society / RWA Plan' }[recommendation.planId]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { l: 'Monthly Cost', v: `₹${{ virtual:999,rooftop:1999,hybrid:2999,society:8999 }[recommendation.planId]}/mo` },
                  { l: 'Est. Savings', v: `₹${{ virtual:'400–700',rooftop:'1000–1800',hybrid:'1800–2800',society:'5000–12000' }[recommendation.planId]}/mo` },
                  { l: 'Capacity', v: `${{ virtual:'3 kW',rooftop:'5 kW',hybrid:'8 kW + Battery',society:'30 kW' }[recommendation.planId]}` },
                  { l: 'Contract', v: `${{ virtual:12,rooftop:24,hybrid:36,society:36 }[recommendation.planId]} months` },
                ].map(item => (
                  <div key={item.l} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.2rem' }}>{item.l}</div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{item.v}</div>
                  </div>
                ))}
              </div>

              {subsidy?.eligible && (
                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Gift size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>🏛️ PM Surya Ghar Subsidy Available!</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>You qualify for up to <strong style={{ color: '#f59e0b' }}>₹{subsidy.subsidy.toLocaleString()}</strong> in government subsidy. VoltGrid handles the paperwork.</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>Low-interest loan at {subsidy.loanRate}% also available</div>
                  </div>
                </div>
              )}

              {stateData && !stateData.vnm && recommendation.planId === 'virtual' && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#ef4444' }}>
                  ⚠️ Virtual Solar requires VNM approval — not yet available in {form.state}. We recommend Rooftop Solar instead.
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                ⏱️ Expected timeline: {subsidy?.processingTime || '4–8 weeks'} · VoltGrid handles all DISCOM paperwork
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', padding: '0.5rem 0', fontStyle: 'italic' }}>Continue to connect your energy data source →</div>

              {/* EV Charging Estimate */}
              {form.hasEV && (() => {
                const dailyKwh = +(form.dailyKm / 6).toFixed(1);
                const monthlyGrid = Math.round(dailyKwh * 30 * 8);
                const monthlySolar = Math.round(dailyKwh * 30 * 3);
                const monthlySavings = monthlyGrid - monthlySolar;
                const coverage = { afternoon: '~85%', morning: '~60%', evening: '~35%', night: '~10%' }[form.chargingTime] || '~50%';
                return (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,212,170,0.15)', paddingTop: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#00d4aa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16} /> EV Charging Estimate</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      {[
                        { l: 'Daily Charging Need', v: `${dailyKwh} kWh` },
                        { l: 'Solar Coverage', v: coverage },
                        { l: 'Monthly Cost (Grid)', v: `₹${monthlyGrid.toLocaleString()}` },
                        { l: 'Monthly Cost (Solar)', v: `₹${monthlySolar.toLocaleString()}` },
                      ].map(item => (
                        <div key={item.l} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.6rem' }}>
                          <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: '0.15rem' }}>{item.l}</div>
                          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem' }}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.65rem', fontSize: '0.78rem', color: '#f59e0b', lineHeight: 1.5 }}>
                      ⚡ Charging your EV on solar through VoltGrid saves you approximately <strong>₹{monthlySavings.toLocaleString()}/month</strong> compared to grid charging.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                      🔋 Smart Solar Charging will be auto-enabled for your account. Your EV will be prioritized to charge during peak solar generation hours.
                    </div>
                  </div>
                );
              })()}
            </div>

            <button onClick={() => navigate('/plans')} style={{ width: '100%', background: 'transparent', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              See All Plans Instead →
            </button>
          </div>
        )}

        {/* Step 5: Connect Your Energy Data */}
        {step === 5 && recommendation && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.25rem' }}>Connect Your Energy Data</h2>
            <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.875rem' }}>How would you like us to track your energy consumption?</p>

            {/* Helper accordion */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button onClick={() => setHelpExpanded(h => !h)} style={{ background: 'none', border: 'none', color: '#00d4aa', fontSize: '0.8rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                🤔 Which option is right for me? {helpExpanded ? '▲' : '▼'}
              </button>
              {helpExpanded && (
                <div style={{ marginTop: '0.6rem', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: '#00d4aa' }}>⚡ IoT Smart Sensor</strong> — Best for real-time accuracy. Ideal if you want live monitoring and instant alerts.</div>
                  <div style={{ marginBottom: '0.4rem' }}><strong style={{ color: '#22c55e' }}>📡 Smart Meter</strong> — Free option if you already have a government NSMP smart meter. Zero extra hardware.</div>
                  <div><strong style={{ color: '#94a3b8' }}>📄 Manual Upload</strong> — Easiest to start. Good for savings estimates. Least precise for daily tracking.</div>
                </div>
              )}
            </div>

            {/* Spinner keyframes */}
            <style>{`@keyframes vg-spin { to { transform: rotate(360deg); } }`}</style>

            {/* Option Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

              {/* ── OPTION 1: IoT Smart Sensor ── */}
              <div onClick={() => { setDataSource('iot'); setSmStatus(null); setUploadStatus(null); setUploadFile(null); }}
                style={{ borderRadius: '14px', border: `2px solid ${dataSource === 'iot' ? '#00d4aa' : '#1e3a5f'}`, background: dataSource === 'iot' ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.02)', boxShadow: dataSource === 'iot' ? '0 0 20px rgba(0,212,170,0.18)' : 'none', opacity: dataSource && dataSource !== 'iot' ? 0.55 : 1, cursor: 'pointer', padding: '1.25rem', transition: 'all 0.25s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Cpu size={22} color="#00d4aa" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>Install IoT Sensor</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Most accurate real-time data</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>Hardware Required</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>We install a certified smart energy sensor at your meter box. Tracks live consumption, voltage, current, and power factor every 15 seconds.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem' }}>
                  {[['Device Cost','₹2,499','one-time'],['Installation','₹499','one-time'],['Monthly Service','₹99','/month']].map(([l,v,s]) => (
                    <div key={l} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{l}</div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem' }}>{v}</div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{s}</div>
                    </div>
                  ))}
                </div>
                {dataSource === 'iot' && (
                  <div style={{ marginTop: '0.85rem', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    💡 A VoltGrid technician will visit during your inspection appointment to install the sensor. You will be billed <strong style={{ color: '#00d4aa' }}>₹2,998 once on activation</strong> and <strong style={{ color: '#00d4aa' }}>₹99 added to your monthly plan</strong>.
                  </div>
                )}
              </div>

              {/* ── OPTION 2: Smart Meter ── */}
              <div onClick={() => { setDataSource('smartmeter'); setUploadStatus(null); setUploadFile(null); }}
                style={{ borderRadius: '14px', border: `2px solid ${dataSource === 'smartmeter' ? '#00d4aa' : '#1e3a5f'}`, background: dataSource === 'smartmeter' ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.02)', boxShadow: dataSource === 'smartmeter' ? '0 0 20px rgba(0,212,170,0.18)' : 'none', opacity: dataSource && dataSource !== 'smartmeter' ? 0.55 : 1, cursor: 'pointer', padding: '1.25rem', transition: 'all 0.25s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Zap size={22} color="#00d4aa" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>Connect Smart Meter</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>No hardware needed</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>Free • No Hardware</span>
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>Smart Meter Required</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.5 }}>If your home has a government smart meter installed under the NSMP scheme, we can pull your daily consumption data directly from your DISCOM's system with your consent.</p>

                {dataSource === 'smartmeter' && (
                  <div onClick={e => e.stopPropagation()}>
                    {/* Sub-option tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      {[['gov','Via Government Portal'],['portal','Via DISCOM Portal Login']].map(([id, label]) => (
                        <button key={id} onClick={() => { setSmSubOption(id); setSmStatus(null); setSmForm(f => ({ ...f, caNumber:'', discom:'', authChecked:false, username:'', password:'', showPw:false })); }}
                          style={{ flex: 1, padding: '0.5rem 0.25rem', borderRadius: '8px', border: `1px solid ${smSubOption === id ? '#00d4aa' : '#1e3a5f'}`, background: smSubOption === id ? 'rgba(0,212,170,0.1)' : 'transparent', color: smSubOption === id ? '#00d4aa' : '#64748b', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Gov Portal sub-form */}
                    {smSubOption === 'gov' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>Authorize VoltGrid to access your meter data through BEE's national energy data framework. Most secure and official route.</div>
                        <input placeholder="CA Number (found on your electricity bill)" value={smForm.caNumber} onChange={e => setSmForm(f => ({ ...f, caNumber: e.target.value }))}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                        <select value={smForm.discom} onChange={e => setSmForm(f => ({ ...f, discom: e.target.value }))}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1829', color: smForm.discom ? '#e2e8f0' : '#64748b', fontSize: '0.82rem', outline: 'none' }}>
                          <option value="">Select your DISCOM</option>
                          {['BESCOM','MSEDCL','TPDDL','UPPCL','TNEB','CESC','Other'].map(d => <option key={d}>{d}</option>)}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>
                          <input type="checkbox" checked={smForm.authChecked} onChange={e => setSmForm(f => ({ ...f, authChecked: e.target.checked }))} style={{ marginTop: '2px', accentColor: '#00d4aa' }} />
                          I authorize VoltGrid to access my meter data for energy monitoring purposes
                        </label>
                        {smStatus !== 'success' && (
                          <button disabled={!smForm.caNumber || !smForm.discom || !smForm.authChecked || smStatus === 'loading'}
                            onClick={() => { setSmStatus('loading'); setTimeout(() => setSmStatus('success'), 1500); }}
                            style={{ padding: '0.65rem', borderRadius: '8px', border: 'none', background: (!smForm.caNumber || !smForm.discom || !smForm.authChecked) ? '#1e3a5f' : 'linear-gradient(135deg,#00d4aa,#22c55e)', color: (!smForm.caNumber || !smForm.discom || !smForm.authChecked) ? '#4a6080' : '#0a0f1e', fontWeight: 700, fontSize: '0.82rem', cursor: (!smForm.caNumber || !smForm.discom || !smForm.authChecked) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {smStatus === 'loading'
                              ? <><span style={{ width: '13px', height: '13px', border: '2px solid #00d4aa', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'vg-spin 0.7s linear infinite' }} /> Verifying…</>
                              : 'Verify & Connect'}
                          </button>
                        )}
                        {smStatus === 'success' && (
                          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={16} /> Smart meter connected. Daily data will sync every 24 hours.
                          </div>
                        )}
                      </div>
                    )}

                    {/* DISCOM Portal sub-form */}
                    {smSubOption === 'portal' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>Securely connect your DISCOM consumer portal account. We fetch your consumption history and bills on your behalf. Your credentials are encrypted and never stored.</div>
                        <input placeholder="DISCOM Portal Username" value={smForm.username} onChange={e => setSmForm(f => ({ ...f, username: e.target.value }))}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ position: 'relative' }}>
                          <input type={smForm.showPw ? 'text' : 'password'} placeholder="DISCOM Portal Password" value={smForm.password} onChange={e => setSmForm(f => ({ ...f, password: e.target.value }))}
                            style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                          <button type="button" onClick={() => setSmForm(f => ({ ...f, showPw: !f.showPw }))}
                            style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                            {smForm.showPw ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <select value={smForm.discom} onChange={e => setSmForm(f => ({ ...f, discom: e.target.value }))}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1829', color: smForm.discom ? '#e2e8f0' : '#64748b', fontSize: '0.82rem', outline: 'none' }}>
                          <option value="">Select your DISCOM</option>
                          {['BESCOM','MSEDCL','TPDDL','UPPCL','TNEB','CESC','Other'].map(d => <option key={d}>{d}</option>)}
                        </select>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>🔒 Bank-level 256-bit encryption. We never store your password. Read-only access only.</div>
                        {smStatus !== 'success' && (
                          <button disabled={!smForm.username || !smForm.password || !smForm.discom || smStatus === 'loading'}
                            onClick={() => { setSmStatus('loading'); setTimeout(() => setSmStatus('success'), 2000); }}
                            style={{ padding: '0.65rem', borderRadius: '8px', border: 'none', background: (!smForm.username || !smForm.password || !smForm.discom) ? '#1e3a5f' : 'linear-gradient(135deg,#00d4aa,#22c55e)', color: (!smForm.username || !smForm.password || !smForm.discom) ? '#4a6080' : '#0a0f1e', fontWeight: 700, fontSize: '0.82rem', cursor: (!smForm.username || !smForm.password || !smForm.discom) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {smStatus === 'loading'
                              ? <><span style={{ width: '13px', height: '13px', border: '2px solid #00d4aa', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'vg-spin 0.7s linear infinite' }} /> Connecting…</>
                              : 'Connect Portal'}
                          </button>
                        )}
                        {smStatus === 'success' && (
                          <div>
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <CheckCircle2 size={16} /> Portal connected. Fetching last 90 days of consumption data...
                            </div>
                            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e3a5f' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                <thead>
                                  <tr style={{ background: 'rgba(0,212,170,0.1)' }}>
                                    {['Date','Units Consumed','Amount'].map(h => <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#00d4aa', fontWeight: 700 }}>{h}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {[['20 Mar 2026','14.2 kWh','₹99.40'],['19 Mar 2026','11.8 kWh','₹82.60'],['18 Mar 2026','16.5 kWh','₹115.50']].map(([d,u,a]) => (
                                    <tr key={d} style={{ borderTop: '1px solid #1e3a5f' }}>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8' }}>{d}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', fontWeight: 600 }}>{u}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#22c55e', fontWeight: 600 }}>{a}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── OPTION 3: Manual / Bill Upload ── */}
              <div onClick={() => { setDataSource('manual'); setSmStatus(null); }}
                style={{ borderRadius: '14px', border: `2px solid ${dataSource === 'manual' ? '#00d4aa' : '#1e3a5f'}`, background: dataSource === 'manual' ? 'rgba(0,212,170,0.07)' : 'rgba(255,255,255,0.02)', boxShadow: dataSource === 'manual' ? '0 0 20px rgba(0,212,170,0.18)' : 'none', opacity: dataSource && dataSource !== 'manual' ? 0.55 : 1, cursor: 'pointer', padding: '1.25rem', transition: 'all 0.25s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Upload size={22} color="#00d4aa" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>Upload Electricity Bill</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Quick setup, monthly updates</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>Manual Updates</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem', lineHeight: 1.5 }}>Upload a photo or PDF of your latest electricity bill. Our system reads your consumption, tariff, and CA number automatically using OCR.</p>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>⚠️ Least accurate for daily tracking. Recommended only if smart meter is unavailable.</div>

                {dataSource === 'manual' && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '0.85rem' }}>
                    {uploadStatus !== 'done' && (
                      <label
                        style={{ display: 'block', border: '2px dashed #2d4a6b', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.15)', transition: 'border-color 0.2s' }}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#00d4aa'; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = '#2d4a6b'; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2d4a6b'; const f = e.dataTransfer.files[0]; if (f) { setUploadFile(f); setUploadStatus('processing'); setTimeout(() => setUploadStatus('done'), 2000); } }}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files[0]; if (f) { setUploadFile(f); setUploadStatus('processing'); setTimeout(() => setUploadStatus('done'), 2000); } }} />
                        {uploadStatus === 'processing'
                          ? <div style={{ color: '#00d4aa', fontSize: '0.82rem' }}>
                              <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid #00d4aa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'vg-spin 0.7s linear infinite', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                              Reading bill… Extracting data…
                            </div>
                          : <div>
                              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📄</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Drag & drop your bill here, or <span style={{ color: '#00d4aa' }}>click to browse</span></div>
                              {uploadFile && <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#00d4aa' }}>{uploadFile.name}</div>}
                              <div style={{ fontSize: '0.7rem', color: '#4a6080', marginTop: '0.2rem' }}>PDF, JPG, PNG supported</div>
                            </div>
                        }
                      </label>
                    )}
                    {uploadStatus === 'done' && (
                      <div>
                        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <CheckCircle2 size={16} /> Bill data extracted. You can re-upload each month or upgrade to Smart Meter anytime.
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.85rem' }}>
                          <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.7rem', letterSpacing: '0.05em' }}>EXTRACTED DATA</div>
                          {[['CA Number','MH-2024-88341'],['DISCOM','MSEDCL'],['Units Last Month','312 kWh'],['Bill Amount','₹2,184']].map(([k,v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem', borderBottom: '1px solid #1e3a5f', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
                              <span style={{ color: '#64748b' }}>{k}</span>
                              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Updated Cost Summary */}
            {dataSource && (
              <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(34,197,94,0.05))', border: '1px solid rgba(0,212,170,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.6rem' }}>UPDATED COST SUMMARY</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Plan ({{ virtual:'Virtual Solar', rooftop:'Rooftop Solar', hybrid:'Hybrid Pro', society:'Society Plan' }[recommendation.planId]})</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>₹{{ virtual:999, rooftop:1999, hybrid:2999, society:8999 }[recommendation.planId]}/mo</span>
                </div>
                {dataSource === 'iot' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>IoT Sensor Service</span>
                      <span style={{ fontWeight: 700, color: '#00d4aa' }}>+₹99/mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid #1e3a5f' }}>
                      <span style={{ fontSize: '0.78rem', color: '#f59e0b' }}>One-time Setup Cost</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹2,998</span>
                    </div>
                  </>
                )}
                {dataSource === 'smartmeter' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.6rem' }}>No additional cost</span>
                  </div>
                )}
                {dataSource === 'manual' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px', padding: '0.2rem 0.6rem' }}>Manual updates</span>
                  </div>
                )}
              </div>
            )}

            {/* Final CTA — only visible when complete */}
            {canProceed ? (
              <button onClick={() => handleSubmit()} disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', fontWeight: 800, borderRadius: '10px', padding: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                {loading ? 'Subscribing…' : <><Sun size={16} /> Accept Plan & Schedule Inspection</>}
              </button>
            ) : dataSource && (
              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem', padding: '0.5rem' }}>
                {dataSource === 'smartmeter' ? '⬆️ Complete the connection above to proceed.' : dataSource === 'manual' ? '⬆️ Upload your bill above to proceed.' : ''}
              </div>
            )}
            <button onClick={() => navigate('/plans')} style={{ width: '100%', background: 'transparent', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>See All Plans Instead →</button>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: 'transparent', color: '#64748b', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
            )}
            <button onClick={handleNext} style={{ flex: 2, background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {step === 3 ? 'Get My Recommendation' : 'Continue'} <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
