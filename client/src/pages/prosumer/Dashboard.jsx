import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Sun, Zap, TrendingUp, Lock } from 'lucide-react';

const DISCOM_COLORS = ['#a855f7', '#00d4aa', '#22c55e', '#f59e0b', '#3b82f6'];

export default function ProsumerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { axios.get('/api/prosumer/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  const distributionData = [
    { name: 'Exported to Grid', value: data.exported },
    { name: 'Self Consumed',     value: data.selfConsumed },
  ];

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Prosumer Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {data.weather?.icon} {data.weather?.condition} · Rate: <span style={{ color: '#a855f7', fontWeight: 700 }}>₹{data.fit}/kWh</span>
            {data.stateData && <span style={{ color: '#4a6080', marginLeft: '0.35rem' }}>({data.premiumLabel})</span>}
          </p>
        </div>
        {data.isLive
          ? <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>🟢 System Live</span>
          : <span style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', color: '#f59e0b', padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>⏳ Pending Activation</span>
        }
      </div>

      {/* DISCOM Pipeline */}
      {!data.isLive && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔌 DISCOM Activation Pipeline
          </div>
          <div style={{ display: 'flex', flex: 1, gap: 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {data.pipelineSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: '100px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto 0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < data.pipelineStep ? '#22c55e' : i === data.pipelineStep ? '#f59e0b' : '#1e3a5f', fontSize: '0.7rem', fontWeight: 800, color: '#0a0f1e', boxShadow: i === data.pipelineStep ? '0 0 12px #f59e0b' : 'none', transition: 'all 0.3s' }}>
                    {i < data.pipelineStep ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: i <= data.pipelineStep ? '#e2e8f0' : '#4a6080', fontWeight: i === data.pipelineStep ? 700 : 400, textAlign: 'center', lineHeight: 1.3 }}>{step}</div>
                </div>
                {i < data.pipelineSteps.length - 1 && (
                  <div style={{ height: '2px', flex: 1, background: i < data.pipelineStep ? '#22c55e' : '#1e3a5f', margin: '0 0 10px', minWidth: '20px' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(251,191,36,0.07)', borderRadius: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
            📞 <strong style={{ color: '#f59e0b' }}>Next step:</strong> Book your site inspection in the Appointments page. DISCOM activation takes 4–8 weeks.
          </div>
        </div>
      )}

      {/* Metric Cards — locked until live */}
      {data.isLive ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: "Today's Generation", value: `${data.todayGeneration} kWh`, color: '#a855f7', icon: <Sun size={15} color="#a855f7" /> },
            { label: "Today's Earnings", value: `₹${data.todayEarnings}`, color: '#f59e0b', icon: <TrendingUp size={15} color="#f59e0b" /> },
            { label: 'Monthly Generation', value: `${data.monthlyGeneration} kWh`, color: '#00d4aa', icon: <Zap size={15} color="#00d4aa" /> },
            { label: 'Monthly Earnings', value: `₹${parseInt(data.monthlyEarnings).toLocaleString()}`, color: '#22c55e', icon: <TrendingUp size={15} color="#22c55e" /> },
            { label: 'Plant Health', value: `${data.plantHealth}%`, color: data.plantHealth > 85 ? '#22c55e' : '#f59e0b', icon: <Sun size={15} color={data.plantHealth > 85 ? '#22c55e' : '#f59e0b'} /> },
          ].map(m => (
            <div key={m.label} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
                <div style={{ background: `${m.color}22`, borderRadius: '8px', padding: '5px' }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Lock size={32} color="#4a6080" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Live metrics will appear here</div>
          <div style={{ color: '#4a6080', fontSize: '0.8rem' }}>Your generation, earnings, and plant health metrics unlock once the net meter is activated.</div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#a855f7" /> 7-Day Generation
            {!data.isLive && <span style={{ fontSize: '0.7rem', color: '#4a6080', background: '#1e3a5f', padding: '0.15rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>Projected</span>}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weeklyGeneration}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="day" stroke="#4a6080" tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kWh`, 'Generation']} contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
              <Bar dataKey="generation" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={data.isLive ? 1 : 0.4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.875rem' }}>☀️ 7-Day Forecast</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
            {(data.generationForecast || []).slice(0, 5).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                <span style={{ color: '#64748b', width: '42px' }}>{d.day}</span>
                <span style={{ color: '#4a6080' }}>{d.condition}</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{d.generation} kWh</span>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.875rem' }}>Energy Distribution</div>
          <PieChart width={200} height={120} style={{ margin: '0 auto' }}>
            <Pie data={distributionData} cx={100} cy={60} innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
              {distributionData.map((_, i) => <Cell key={i} fill={DISCOM_COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '0.78rem' }} />
            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '0.72rem', color: '#94a3b8' }} />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
