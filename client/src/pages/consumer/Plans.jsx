import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertTriangle, ChevronRight, X, Info } from 'lucide-react';

const PLAN_COLORS = { virtual: '#00d4aa', rooftop: '#22c55e', hybrid: '#a855f7', society: '#f59e0b' };
const PLAN_ICONS  = { virtual: '⚡', rooftop: '🏠', hybrid: '🔋', society: '🏘️' };

export default function Plans() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [userState, setUserState] = useState(null);
  const [loading, setLoading] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    axios.get('/api/consumer/plans').then(r => {
      setPlans(r.data.plans);
      setActivePlan(r.data.activePlan);
      setStateData(r.data.stateData);
      setUserState(r.data.userState);
    });
  }, []);

  const handleSwitch = async (planId) => {
    if (planId === activePlan) return;
    const plan = plans.find(p => p.id === planId);
    if (plan?.vnmRequired && stateData && !stateData.vnm) {
      addToast(`⚠️ Virtual Solar requires VNM — not yet available in your state`, 'error');
      return;
    }
    setLoading(planId);
    await axios.post('/api/consumer/subscribe', { planId });
    setActivePlan(planId);
    addToast(`✅ Switched to ${plan?.name}! Changes take effect next billing cycle.`);
    setLoading('');
  };

  const handleCancel = async () => {
    const r = await axios.post('/api/consumer/cancel', { reason: cancelReason });
    setActivePlan(null);
    setCancelModal(false);
    addToast(`Subscription cancelled.${r.data.cancellationFee > 0 ? ` Cancellation fee: ₹${r.data.cancellationFee}` : ' No fee charged.'}`);
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Subscription Plans</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Switch anytime. Changes take effect next billing cycle.</p>
        </div>
        {userState && stateData && (
          <div style={{ background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#64748b' }}>Your state: </span><span style={{ color: '#00d4aa', fontWeight: 700 }}>{userState}</span>
            <span style={{ color: '#4a6080', margin: '0 0.5rem' }}>·</span>
            <span style={{ color: '#64748b' }}>Feed-in rate: </span><span style={{ color: '#22c55e', fontWeight: 700 }}>₹{stateData.fit}/kWh</span>
            <span style={{ color: '#4a6080', margin: '0 0.5rem' }}>·</span>
            <span style={{ color: stateData.vnm ? '#22c55e' : '#ef4444', fontWeight: 600 }}>VNM: {stateData.vnm ? 'Available ✓' : 'Not Available'}</span>
          </div>
        )}
      </div>

      {/* PM Surya Ghar Banner */}
      <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🏛️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>PM Surya Ghar: Muft Bijli Yojana</div>
          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.15rem' }}>Eligible households can claim up to <strong style={{ color: '#f59e0b' }}>₹78,000</strong> government subsidy. VoltGrid handles the application process for you.</div>
        </div>
        <Info size={16} color="#f59e0b" />
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {plans.map(plan => {
          const color = PLAN_COLORS[plan.id] || '#00d4aa';
          const isActive = activePlan === plan.id;
          const isBlocked = plan.vnmRequired && stateData && !stateData.vnm;

          return (
            <div key={plan.id} style={{ border: `2px solid ${isActive ? color : isBlocked ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', padding: '1.5rem', background: isActive ? `${color}0d` : 'rgba(255,255,255,0.02)', position: 'relative', boxShadow: isActive ? `0 0 30px ${color}25` : undefined, transition: 'all 0.25s' }}>
              {isActive && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: color, color: '#0a0f1e', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.75rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>CURRENT PLAN</div>
              )}
              {plan.badge && !isActive && (
                <div style={{ position: 'absolute', top: '-10px', right: '1rem', background: `${color}22`, border: `1px solid ${color}44`, color, fontSize: '0.62rem', fontWeight: 700, padding: '0.18rem 0.6rem', borderRadius: '999px' }}>{plan.badge}</div>
              )}

              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{PLAN_ICONS[plan.id]}</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>{plan.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', minHeight: '36px' }}>{plan.description}</div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color }}>{plan.capacity}</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#e2e8f0' }}>₹{plan.price.toLocaleString()}</span>
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>/month</span>
              </div>

              {/* Savings range */}
              <div style={{ background: `${color}11`, border: `1px solid ${color}22`, borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>Est. savings: </span>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>₹{plan.savings.min.toLocaleString()}–₹{plan.savings.max.toLocaleString()}/mo</span>
              </div>

              {/* Features */}
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <CheckCircle2 size={12} color={color} style={{ flexShrink: 0, marginTop: '2px' }} /> {f}
                  </div>
                ))}
              </div>

              {/* Terms */}
              <div style={{ fontSize: '0.67rem', color: '#4a6080', marginBottom: '1rem', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                📅 {plan.contractMonths}-month contract · {plan.cancellationFee > 0 ? `₹${plan.cancellationFee} cancellation fee` : 'Cancel anytime'}<br />
                🛡️ SLA: {plan.sla} · Response: {plan.responseTime}
              </div>

              {/* VNM Warning */}
              {isBlocked && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.5rem 0.6rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#ef4444', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                  Virtual Net Metering not yet available in your state
                </div>
              )}

              <button onClick={() => handleSwitch(plan.id)} disabled={isActive || loading === plan.id || isBlocked} style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: isActive ? `1px solid ${color}40` : `2px solid ${color}`, background: isActive ? `${color}15` : isBlocked ? 'rgba(100,116,139,0.1)' : `${color}22`, color: isActive ? color : isBlocked ? '#4a6080' : color, fontWeight: 700, fontSize: '0.82rem', cursor: isActive || isBlocked ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {loading === plan.id ? 'Switching…' : isActive ? '✓ Active Plan' : isBlocked ? 'Not Available' : `Switch to ${plan.name} →`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison table hint + Cancel option */}
      {activePlan && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setCancelModal(true)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#64748b', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
            Cancel subscription
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1rem' }}>Cancel Subscription</div>
              <button onClick={() => setCancelModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.83rem', marginBottom: '1rem' }}>
              Cancellation fee: <strong style={{ color: '#ef4444' }}>₹{plans.find(p => p.id === activePlan)?.cancellationFee || 0}</strong>. If you're not happy, let us fix it first.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Reason for cancellation</label>
              <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Help us improve…" style={{ marginTop: '0.5rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Keep Plan</button>
              <button onClick={handleCancel} style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Cancel →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
