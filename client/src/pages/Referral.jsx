import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Gift, Share2, CheckCircle2, Users, Copy } from 'lucide-react';

export default function Referral() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => { axios.get('/api/referral/stats').then(r => setStats(r.data)); }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(stats?.referralCode || '');
    addToast('📋 Referral code copied!', 'success');
  };

  const handleApply = async () => {
    if (!applyCode) { addToast('Enter a referral code', 'error'); return; }
    setApplying(true);
    try {
      const r = await axios.post('/api/referral/apply', { code: applyCode });
      addToast(`🎁 ${r.data.message}`, 'success');
      setStats(s => ({ ...s, freeMonths: r.data.freeMonths }));
      setApplyCode('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Invalid code', 'error');
    } finally { setApplying(false); }
  };

  if (!stats) return <div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  const referralUrl = `https://voltgrid.in/join?ref=${stats.referralCode}`;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '750px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>☀️ Refer & Earn</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Invite friends to VoltGrid — you both get rewarded</p>
      </div>

      {/* Hero card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.14), rgba(34,197,94,0.06))', border: '2px solid rgba(0,212,170,0.3)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 0 32px rgba(0,212,170,0.1)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#00d4aa', marginBottom: '0.5rem' }}>Your Referral Code</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '0.12em', color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(0,212,170,0.2)' }}>
                {stats.referralCode}
              </div>
              <button onClick={copyCode} style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa', borderRadius: '8px', padding: '0.5rem 0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <Copy size={13} /> Copy
              </button>
              <button onClick={() => { navigator.share?.({ title: 'VoltGrid', text: `Join VoltGrid solar! Use my code ${stats.referralCode}`, url: referralUrl }); }} style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', color: '#00d4aa', borderRadius: '8px', padding: '0.5rem 0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <Share2 size={13} /> Share
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4a6080' }}>Share link: <span style={{ color: '#64748b' }}>{referralUrl}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Referrals', value: stats.referralCount, icon: <Users size={16} color="#00d4aa" /> },
              { label: 'Free Months', value: stats.freeMonths, icon: <Gift size={16} color="#22c55e" /> },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1rem 1.25rem', textAlign: 'center', minWidth: '90px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>{m.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: '#e2e8f0' }}>{m.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift size={16} color="#00d4aa" /> How it Works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {[
            { step: '1', desc: 'Share your code with a friend', icon: '📤' },
            { step: '2', desc: 'Friend signs up & subscribes', icon: '✅' },
            { step: '3', desc: 'You both get 1 month FREE', icon: '🎁' },
            { step: '4', desc: 'Earn up to 6 free months', icon: '🏆' },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center', padding: '1rem', border: '1px solid rgba(0,212,170,0.1)', borderRadius: '10px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, color: '#00d4aa', fontSize: '0.7rem', marginBottom: '0.3rem' }}>Step {s.step}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,212,170,0.05)', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
          💡 <strong style={{ color: '#00d4aa' }}>Max 6 free months</strong> per account · Reward credits applied to next billing cycle · Both parties must be active subscribers
        </div>
      </div>

      {/* Apply a code */}
      <div className="glass-card">
        <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} color="#22c55e" /> Have a Referral Code?
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" placeholder="Enter code (e.g. VG4A8X2)" value={applyCode} onChange={e => setApplyCode(e.target.value.toUpperCase())} style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.08em' }} maxLength={8} />
          <button onClick={handleApply} disabled={applying} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#0a0f1e', border: 'none', borderRadius: '10px', padding: '0.7rem 1.25rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
            {applying ? 'Applying…' : 'Apply Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
