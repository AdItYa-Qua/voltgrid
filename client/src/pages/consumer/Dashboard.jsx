import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Sun, TrendingUp, Leaf, Battery, Car, AlertTriangle, X, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function MetricCard({ label, value, unit, icon, color, sub, highlight }) {
  return (
    <div className="glass-card" style={{ boxShadow: highlight ? `0 0 24px ${color}30` : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</span>
        <div style={{ background: `${color}22`, borderRadius: '8px', padding: '6px', display: 'flex' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#4a6080', marginTop: '0.3rem' }}>{unit}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#22c55e', marginTop: '0.15rem', fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function ConsumerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [outage, setOutage] = useState(false);
  const [evMode, setEvMode] = useState(false);
  const [liveData, setLiveData] = useState([]);
  const liveRef = useRef([]);

  useEffect(() => {
    axios.get('/api/consumer/dashboard').then(r => {
      setData(r.data);
      setEvMode(r.data.evMode || false);
    });
  }, []);

  const handleOutage = () => {
    setOutage(true);
    addToast('⚡ Grid outage simulated — battery backup activated!', 'error');
    setTimeout(() => { setOutage(false); addToast('✅ Grid restored. Normal operation resumed.', 'success'); }, 8000);
  };

  const handleEvToggle = async () => {
    const next = !evMode;
    setEvMode(next);
    try {
      await axios.post('/api/consumer/ev-mode', { enabled: next });
      addToast(next ? '⚡ EV Mode ON — charging your vehicle on solar!' : '🔌 EV Mode OFF', next ? 'success' : 'info');
    } catch {}
  };

  if (!data) return <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard…</div>;

  const isVirtual = user?.plan === 'virtual' || !user?.plan;
  const isHybrid = user?.plan === 'hybrid';

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.2rem' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} ☀️
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {data.weather?.condition} {data.weather?.icon}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* EV Mode toggle */}
          <button onClick={handleEvToggle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '10px', border: `1px solid ${evMode ? '#22c55e' : '#1e3a5f'}`, background: evMode ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.02)', color: evMode ? '#22c55e' : '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Car size={14} /> EV Mode {evMode ? 'ON ✓' : 'OFF'}
          </button>
          <button onClick={handleOutage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <Zap size={14} /> Simulate Outage
          </button>
        </div>
      </div>

      {/* OIS Banner */}
      {outage && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', animation: 'pulse 1.5s infinite' }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>⚡ Grid Outage Detected — OIS Active</div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.1rem' }}>
              Grid: <span style={{ color: '#ef4444', fontWeight: 700 }}>OFFLINE</span> · Battery Backup: <span style={{ color: '#22c55e', fontWeight: 700 }}>ACTIVE</span>{isHybrid ? ' · Est. runtime: 6 hrs' : ' · Upgrade to Hybrid Pro for backup'}
            </div>
          </div>
          <button onClick={() => setOutage(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* EV Mode Banner */}
      {evMode && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Car size={18} color="#22c55e" />
          <div style={{ flex: 1, fontSize: '0.82rem' }}>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>EV Charging on Solar 🚗⚡</span>
            <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>Today you drove approx. {Math.floor(data.todayGeneration * 0.3 * 6)} km on sunshine · Saved ₹{data.evSaved || Math.floor(data.todayGeneration * 0.3 * 12)} vs grid charging</span>
          </div>
        </div>
      )}

      {/* 🟢 HERO METRIC - Savings vs DISCOM */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.14), rgba(34,197,94,0.08))', border: '2px solid rgba(0,212,170,0.35)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(0,212,170,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#00d4aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>💰 You Saved This Month</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#00d4aa', lineHeight: 1 }}>₹{data.monthlySavings.toLocaleString()}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>vs your estimated old {data.stateData?.discom || 'DISCOM'} bill of <span style={{ color: '#94a3b8', fontWeight: 600 }}>₹{data.oldDiscombill}</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem' }}>Annual projection</div>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#22c55e' }}>₹{(data.monthlySavings * 12).toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#4a6080' }}>saved per year</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard label="Today's Usage" value={data.todayUsage} unit="kWh consumed" icon={<Zap size={15} color="#f59e0b" />} color="#f59e0b" />
        <MetricCard label="Solar Generated" value={data.todayGeneration} unit="kWh from sun" icon={<Sun size={15} color="#00d4aa" />} color="#00d4aa" sub={`${data.weather?.icon} ${data.weather?.condition}`} />
        <MetricCard label="Grid Dependency" value={`${data.gridDependency}%`} unit="of usage from grid" icon={<Zap size={15} color="#a855f7" />} color="#a855f7" />
        <MetricCard label="CO₂ Saved Today" value={data.co2Saved} unit="kg CO₂ offset" icon={<Leaf size={15} color="#22c55e" />} color="#22c55e" sub={`≈ ${(data.co2Saved / 22).toFixed(1)} trees today`} />
        {isHybrid && <MetricCard label="Battery Status" value="ON" unit="6-hr backup ready" icon={<Battery size={15} color="#00d4aa" />} color="#00d4aa" highlight />}
      </div>

      {/* Charts + Forecast + DISCOM Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#00d4aa" /> 7-Day Usage vs Generation
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.weeklyData}>
              <defs>
                <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="day" stroke="#4a6080" tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="generation" name="Generation" stroke="#00d4aa" fill="url(#gradGen)" strokeWidth={2} />
              <Area type="monotone" dataKey="usage" name="Usage" stroke="#f59e0b" fill="url(#gradUse)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 7-day generation forecast */}
          <div className="glass-card" style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ☀️ 7-Day Generation Forecast
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(data.generationForecast || []).slice(0, 5).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: '#64748b', width: '50px' }}>{d.day}</span>
                  <span style={{ color: '#94a3b8' }}>{d.condition}</span>
                  <span style={{ fontWeight: 700, color: '#00d4aa' }}>{d.generation} kWh</span>
                </div>
              ))}
            </div>
          </div>

          {/* DISCOM Connection Tracker */}
          {data.discSteps && (
            <div className="glass-card" style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔌 DISCOM Connection
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.discSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: i < data.discStep ? '#22c55e' : i === data.discStep ? '#f59e0b' : '#1e3a5f', boxShadow: i === data.discStep ? '0 0 8px #f59e0b' : 'none' }} />
                    <span style={{ color: i <= data.discStep ? '#e2e8f0' : '#4a6080', fontWeight: i === data.discStep ? 700 : 400 }}>{s}</span>
                    {i < data.discStep && <span style={{ color: '#22c55e', fontSize: '0.65rem' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan-gated IoT upgrade prompt */}
      {isVirtual && (
        <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#a855f7' }}>📡 Unlock Real-time IoT Monitoring</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>Available with Rooftop Solar & Hybrid Pro plans</div>
          </div>
          <a href="/plans" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7', padding: '0.45rem 0.875rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Upgrade <ChevronRight size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
