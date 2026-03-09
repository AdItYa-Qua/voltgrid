import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Banknote, TrendingUp, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Earnings() {
  const [data, setData] = useState(null);

  useEffect(() => { axios.get('/api/prosumer/earnings').then(r => setData(r.data)); }, []);

  if (!data) return <div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Earnings & Payouts</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Revenue from solar energy export to the grid</p>
      </div>

      {/* Tariff Info */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} /> Your Feed-in Tariff
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '0.2rem' }}>State APPC Rate</div>
            <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '1.1rem' }}>₹{data.stateFit}/kWh</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '0.2rem' }}>VoltGrid Premium</div>
            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>+₹{data.voltgridPremium}/kWh</div>
          </div>
          <div style={{ borderLeft: '1px solid #1e3a5f', paddingLeft: '2rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '0.2rem' }}>Your VoltGrid Rate</div>
            <div style={{ fontWeight: 900, color: '#a855f7', fontSize: '1.6rem' }}>₹{data.feedInTariff}/kWh</div>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#4a6080' }}>{data.premiumNote}</div>
      </div>

      {/* Stats */}
      {data.isLive ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Pending Payout', value: `₹${data.pendingPayout}`, color: '#f59e0b' },
            { label: 'Next Projected', value: `₹${data.projectedNext?.toLocaleString()}`, color: '#a855f7' },
            { label: 'Total Earned', value: `₹${data.totalEarned?.toLocaleString()}`, color: '#22c55e' },
          ].map(m => (
            <div key={m.label} className="glass-card">
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Lock size={28} color="#4a6080" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Earnings begin after net meter activation</div>
          <div style={{ color: '#4a6080', fontSize: '0.78rem' }}>Complete your site inspection and DISCOM process to start earning.</div>
        </div>
      )}

      {/* Payout History */}
      <div className="glass-card">
        <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Banknote size={16} color="#a855f7" /> Payout History
        </div>
        {data.history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#4a6080', padding: '1.5rem 0', fontSize: '0.85rem' }}>No payouts yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e3a5f' }}>
                  {['Month','Date','Units Exported','State Rate','VoltGrid Rate','Amount','Status'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.history.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#e2e8f0', fontWeight: 600 }}>{row.month}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{row.date}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{row.units} kWh</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>₹{row.stateFit}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#a855f7', fontWeight: 700 }}>₹{row.voltgridFit}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#22c55e', fontWeight: 700 }}>₹{row.amount.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span className={`badge ${row.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'fit-content' }}>
                        {row.status === 'Paid' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
