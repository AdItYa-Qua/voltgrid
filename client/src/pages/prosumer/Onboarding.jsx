import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, MapPin, Zap, Banknote, Cloud, ChevronRight, Info } from 'lucide-react';

const STATES = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Telangana','Andhra Pradesh','Uttar Pradesh','West Bengal','Madhya Pradesh','Kerala','Punjab','Haryana','Bihar','Other'];
const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Jaipur','Kolkata','Lucknow','Ahmedabad','Other'];

export default function ProsumerOnboarding() {
  const { refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ area: '', state: '', location: 'Mumbai', weather: 'Sunny', existing: 'No', payout: 'Bank' });
  const [tariffData, setTariffData] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTariff = async (state) => {
    if (!state || state === 'Other') return;
    try {
      const r = await axios.get(`/api/prosumer/tariff/${state}`);
      setTariffData(r.data);
    } catch {}
  };

  const handleStateChange = (state) => {
    setForm({ ...form, state });
    fetchTariff(state);
    setEstimate(null);
  };

  const getEstimate = (f) => {
    const area = parseInt(f.area) || 0;
    const weatherFactor = { Sunny: 1.0, Mixed: 0.8, Cloudy: 0.6 }[f.weather] || 1.0;
    const capacity = +(area * 0.01 * weatherFactor).toFixed(1);
    const daily = +(capacity * 4.5 * weatherFactor).toFixed(1);
    const monthly = +(daily * 30).toFixed(0);
    const fit = tariffData?.voltgridFit || 3.50;
    const earnings = +(monthly * 0.68 * fit).toFixed(0); // 68% exported
    return { capacity, daily, monthly, earnings, fit };
  };

  const handleCalc = (e) => {
    e.preventDefault();
    if (!form.area) { addToast('Please enter your rooftop area', 'error'); return; }
    if (!form.state) { addToast('Please select your state to see accurate tariff rates', 'error'); return; }
    setEstimate(getEstimate(form));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/prosumer/onboard', form);
      await refreshUser();
      addToast('🎉 Asset registered! Book your site inspection to begin.');
      navigate('/dashboard');
    } catch { addToast('Something went wrong', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', paddingTop: '5rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.07) 0%, #0a0f1e 60%)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem' }}>☀️ Register Your Solar Asset</h1>
          <p style={{ color: '#64748b' }}>Start earning from your rooftop generation. VoltGrid handles DISCOM paperwork.</p>
        </div>

        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleCalc} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* State selector — critical for correct FIT */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                <MapPin size={16} color="#a855f7" /> Your State <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={form.state} onChange={e => handleStateChange(e.target.value)}>
                <option value="">Select state (required for accurate tariff)</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              {tariffData && (
                <div style={{ marginTop: '0.6rem', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ color: '#64748b' }}>DISCOM: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{tariffData.discom}</span></div>
                    <div style={{ color: '#64748b' }}>State APPC: <span style={{ color: '#94a3b8', fontWeight: 600 }}>₹{tariffData.stateFit}/kWh</span></div>
                    <div style={{ color: '#64748b' }}>VoltGrid Rate: <span style={{ color: '#a855f7', fontWeight: 700 }}>₹{tariffData.voltgridFit}/kWh ✨</span></div>
                    <div style={{ color: '#64748b' }}>Approval time: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tariffData.approvalWeeks}</span></div>
                  </div>
                  <div style={{ marginTop: '0.4rem', color: '#64748b', fontSize: '0.7rem' }}>
                    💡 VoltGrid pays <strong style={{ color: '#a855f7' }}>₹0.50/kWh premium</strong> above the state APPC rate
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                <Sun size={16} color="#a855f7" /> Rooftop / land area (sq ft)
              </label>
              <input type="number" placeholder="e.g. 800" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} min="0" />
              {form.area && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem' }}>≈ {+(parseInt(form.area) * 0.01).toFixed(1)} kW installable capacity</div>}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                <MapPin size={16} color="#a855f7" /> Nearest City
              </label>
              <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cloud size={16} color="#a855f7" /> Typical weather condition
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['Sunny', 'Mixed', 'Cloudy'].map(w => (
                  <button key={w} type="button" onClick={() => setForm({ ...form, weather: w })} style={{ padding: '0.75rem', borderRadius: '10px', border: `2px solid ${form.weather === w ? '#a855f7' : '#1e3a5f'}`, background: form.weather === w ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)', color: form.weather === w ? '#a855f7' : '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s' }}>
                    {w === 'Sunny' ? '☀️' : w === 'Mixed' ? '⛅' : '☁️'} {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} color="#a855f7" /> Existing solar installation?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['Yes', 'No'].map(v => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, existing: v })} style={{ padding: '0.75rem', borderRadius: '10px', border: `2px solid ${form.existing === v ? '#a855f7' : '#1e3a5f'}`, background: form.existing === v ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)', color: form.existing === v ? '#a855f7' : '#64748b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                    {v === 'Yes' ? '⚡ Yes — already installed' : '🔧 No — need installation'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={16} color="#a855f7" /> Preferred payout method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {['Bank', 'UPI'].map(v => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, payout: v })} style={{ padding: '0.75rem', borderRadius: '10px', border: `2px solid ${form.payout === v ? '#a855f7' : '#1e3a5f'}`, background: form.payout === v ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)', color: form.payout === v ? '#a855f7' : '#64748b', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                    {v === 'Bank' ? '🏦 Bank Transfer' : '📱 UPI'}
                  </button>
                ))}
              </div>
            </div>

            {/* DISCOM process info box */}
            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem' }}>
              <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#f59e0b' }}>What happens next?</strong><br />
                After registration, VoltGrid files your {tariffData?.discom || 'DISCOM'} net metering application. Approval typically takes <strong style={{ color: '#f59e0b' }}>{tariffData?.approvalWeeks || '4–8 weeks'}</strong>. Earnings begin only after your net meter is activated. We'll keep you updated at every step.
              </div>
            </div>

            <button type="submit" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white', fontWeight: 700, borderRadius: '10px', padding: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Sun size={16} /> Calculate Earnings Potential
            </button>
          </form>
        </div>

        {estimate && (
          <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,197,94,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 0 32px rgba(168,85,247,0.15)' }}>
            <div style={{ fontWeight: 800, color: '#a855f7', fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#a855f7" /> Your Earnings Potential
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Installable Capacity', value: `${estimate.capacity} kW` },
                { label: 'Daily Generation', value: `${estimate.daily} kWh` },
                { label: 'Monthly Generation', value: `${estimate.monthly} kWh` },
                { label: 'Monthly Earnings', value: `₹${parseInt(estimate.earnings).toLocaleString()}` },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Banknote size={13} color="#a855f7" />
              <span>VoltGrid rate: <strong style={{ color: '#a855f7' }}>₹{estimate.fit}/kWh</strong> (state APPC ₹{tariffData?.stateFit} + ₹0.50 premium) · 68% exported</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4a6080', marginBottom: '1.25rem', paddingLeft: '1.25rem' }}>
              Earnings start after net meter activation (~{tariffData?.approvalWeeks || '4–8 weeks'})
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white', fontWeight: 700, borderRadius: '10px', padding: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              {loading ? 'Registering…' : <><span>Register Asset & Book Site Inspection</span><ChevronRight size={18} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
