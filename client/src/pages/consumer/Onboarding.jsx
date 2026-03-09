import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Zap, Sun, MapPin, Star, ChevronRight, CheckCircle2, Gift } from 'lucide-react';

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
  const [form, setForm] = useState({ homeType: '', state: '', city: '', bill: '', kwh: '', billMode: 'rupees', appliances: [], backupHours: 4, goal: '', acCount: 1 });
  const [stateData, setStateData] = useState(null);
  const [subsidy, setSubsidy] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const stepTitles = ['Home Type', 'Location & State', 'Energy Audit', 'Your Needs', 'Your Plan'];
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

              <button onClick={() => handleSubmit()} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', fontWeight: 800, borderRadius: '10px', padding: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                {loading ? 'Subscribing…' : <><Sun size={16} /> Subscribe & Go to Dashboard</>}
              </button>
            </div>

            <button onClick={() => navigate('/plans')} style={{ width: '100%', background: 'transparent', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              See All Plans Instead →
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
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
