import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Banknote, TrendingUp, AlertCircle, MessageSquare, Download, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function Billing() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeText, setDisputeText] = useState('');

  useEffect(() => { axios.get('/api/consumer/billing').then(r => setData(r.data)); }, []);

  if (!data) return <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading billing…</div>;

  const { billing, history } = data;

  const handlePay = () => addToast('🔐 Opening UPI payment gateway… (Demo mode)', 'success');
  const handleInvoice = () => addToast('📄 Invoice PDF generated and downloaded', 'success');
  const handleDispute = () => {
    if (!disputeText) { addToast('Please describe the issue', 'error'); return; }
    addToast('🎫 Billing dispute raised — our team will respond within 24h', 'success');
    setDisputeOpen(false);
    setDisputeText('');
  };

  const rows = [
    { label: 'VoltGrid Subscription Fee', value: billing.voltgridFee, color: '#e2e8f0', note: 'Monthly plan charge' },
    { label: `Solar Export Credit (${billing.unitsExported} kWh × ₹${billing.stateFit}/kWh)`, value: billing.exportCredit, color: '#22c55e', note: `${billing.discom} net metering credit` },
    { label: `Grid Import Cost (${Math.floor(billing.units * 0.12)} kWh)`, value: billing.gridImport, color: '#f59e0b', note: 'Residual grid consumption' },
    { label: 'EV Solar Charging Credit', value: -520, color: '#22c55e', note: 'ℹ️ Discount: EV units consumed from solar at ₹3/kWh instead of grid rate ₹8/kWh' },
    { label: 'GST (18%)', value: billing.gst, color: '#94a3b8', note: '' },
  ];

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Billing</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Transparent breakdown of your solar savings</p>
      </div>

      {/* Savings Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(34,197,94,0.06))', border: '2px solid rgba(0,212,170,0.3)', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 0 28px rgba(0,212,170,0.1)' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#00d4aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>You Saved vs Old DISCOM Bill</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#00d4aa' }}>₹{billing.savedVsOldBill.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Old estimated bill: ₹{billing.oldBillEstimate} → VoltGrid net: ₹{billing.total}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem' }}>Due by</div>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{new Date(billing.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</div>
          <span className={`badge ${billing.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ marginTop: '0.4rem', display: 'inline-block' }}>{billing.status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Itemized breakdown */}
        <div className="glass-card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Banknote size={16} color="#00d4aa" /> This Month's Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {rows.map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{row.label}</div>
                  {row.note && <div style={{ fontSize: '0.67rem', color: '#4a6080', marginTop: '0.1rem' }}>{row.note}</div>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: row.value < 0 ? '#22c55e' : row.color, whiteSpace: 'nowrap' }}>
                  {row.value < 0 ? '−₹' + Math.abs(row.value) : '₹' + row.value}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', borderTop: '2px solid rgba(0,212,170,0.2)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>Net Payable</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#00d4aa' }}>₹{billing.total}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handlePay} style={{ flex: 1, background: 'linear-gradient(135deg, #00d4aa, #22c55e)', color: '#0a0f1e', border: 'none', borderRadius: '8px', padding: '0.65rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Banknote size={14} /> Pay Now (UPI)
            </button>
            <button onClick={handleInvoice} style={{ flex: 1, background: 'transparent', border: '1px solid #1e3a5f', color: '#94a3b8', borderRadius: '8px', padding: '0.65rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Download size={14} /> Invoice
            </button>
          </div>
          <button onClick={() => setDisputeOpen(true)} style={{ width: '100%', marginTop: '0.75rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', padding: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <AlertCircle size={12} /> This bill looks wrong
          </button>

          {/* UPI AutoPay hint */}
          <div style={{ marginTop: '0.75rem', background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.72rem', color: '#a855f7' }}>
            💡 Set up UPI AutoPay to never miss a due date. Manage in Account Settings.
          </div>
        </div>

        {/* 6-month history chart */}
        <div className="glass-card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#00d4aa" /> 6-Month History
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="month" stroke="#4a6080" tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [`₹${Math.abs(v)}`, n]} content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div style={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '0.6rem 0.8rem', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>{label}</div>
                    {payload.map((p, i) => <div key={i} style={{ color: p.color, marginBottom: '0.15rem' }}>{p.name}: ₹{Math.abs(p.value)}</div>)}
                    <div style={{ color: '#22c55e', borderTop: '1px solid #1e3a5f', paddingTop: '0.25rem', marginTop: '0.25rem' }}>⚡ EV Savings: ₹{Math.floor(Math.random() * 200 + 350)}</div>
                  </div>
                );
              }} />
              <Bar dataKey="voltgridFee" name="Plan Fee" fill="#a855f7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="total" name="Net Paid" fill="#00d4aa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#64748b' }}>{h.month}</span>
                <span style={{ color: '#94a3b8' }}>Fee: ₹{h.voltgridFee} | Net: ₹{h.total}</span>
                <span className={`badge ${h.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>{h.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {disputeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Dispute a Bill Issue
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>Our billing team will review and respond within 24 hours.</p>
            <textarea rows={4} value={disputeText} onChange={e => setDisputeText(e.target.value)} placeholder="Describe the issue (e.g. wrong export credit, unexpected charges)…" style={{ marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDisputeOpen(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #1e3a5f', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDispute} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>Submit Dispute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
