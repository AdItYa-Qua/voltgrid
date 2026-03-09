import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Zap, Sun, User, Building2, ChevronRight, CheckCircle2 } from 'lucide-react';

const roles = [
  {
    id: 'consumer',
    icon: '⚡',
    title: 'Consumer',
    subtitle: 'I want to use clean energy',
    description: 'Subscribe to a solar plan, lower your electricity bill, and get outage protection.',
    highlights: ['Monthly savings vs DISCOM', 'Real-time IoT monitoring', 'Carbon footprint tracker', 'Outage battery backup'],
    color: '#00d4aa',
  },
  {
    id: 'prosumer',
    icon: '☀️',
    title: 'Prosumer',
    subtitle: 'I generate and sell solar energy',
    description: 'Register rooftop assets, earn from grid export at state FIT + VoltGrid premium, track payouts.',
    highlights: ['State FIT + ₹0.50/kWh premium', 'Real-time generation tracking', 'DISCOM paperwork handled', 'Monthly UPI/Bank payouts'],
    color: '#a855f7',
  },
  {
    id: 'rwa',
    icon: '🏘️',
    title: 'Society / RWA',
    subtitle: 'Managing a housing complex',
    description: 'Group solar for entire housing societies, RWAs, and apartment complexes. One subscription for all.',
    highlights: ['30 kW shared installation', 'Per-unit sub-metering', 'Society billing dashboard', 'DISCOM bulk application'],
    color: '#f59e0b',
  },
];

const COLOR_MAP = { consumer: '#00d4aa', prosumer: '#a855f7', rwa: '#f59e0b' };
const ONBOARD_MAP = { consumer: '/onboarding', prosumer: '/onboarding', rwa: '/onboarding' };

export default function RoleSelection() {
  const { setRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setRole(selected);
      const label = { consumer: 'Consumer', prosumer: 'Prosumer', rwa: 'Society Manager' }[selected];
      addToast(`✅ Welcome! You're set up as a ${label}.`);
      navigate(ONBOARD_MAP[selected] || '/onboarding');
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.06) 0%, #0a0f1e 60%)', paddingTop: '4rem' }}>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', borderRadius: '16px', padding: '12px', marginBottom: '1rem' }}>
            <Zap size={24} color="#060d1f" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem' }}>How will you use VoltGrid?</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>This determines your dashboard, features, and experience.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {roles.map(role => {
            const isSelected = selected === role.id;
            const color = role.color;
            return (
              <div key={role.id} onClick={() => setSelected(role.id)} style={{ background: '#0f1729', border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', padding: '1.75rem', cursor: 'pointer', transition: 'all 0.25s', boxShadow: isSelected ? `0 0 32px ${color}25` : 'none', position: 'relative' }}>
                {isSelected && (
                  <CheckCircle2 size={20} color={color} style={{ position: 'absolute', top: '1rem', right: '1rem' }} />
                )}
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{role.icon}</div>
                <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.2rem', color: '#e2e8f0' }}>{role.title}</h2>
                <p style={{ color, fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem' }}>{role.subtitle}</p>
                <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{role.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {role.highlights.map(h => (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }} /> {h}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn-teal" onClick={handleContinue} disabled={!selected || loading} style={{ padding: '0.875rem 2.5rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: !selected ? 0.5 : 1 }}>
            {loading ? 'Setting up…' : <><span>Continue as {{ consumer: 'Consumer', prosumer: 'Prosumer', rwa: 'Society Manager' }[selected] || '…'}</span><ChevronRight size={18} /></>}
          </button>
          <p style={{ color: '#2d4a6a', fontSize: '0.75rem', marginTop: '1rem' }}>You can contact support to change your role</p>
        </div>
      </div>
    </div>
  );
}
