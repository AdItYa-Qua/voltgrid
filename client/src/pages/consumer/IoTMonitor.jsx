import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Thermometer, Battery, Activity, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HARDWARE_PLANS = ['rooftop', 'hybrid', 'society'];

function Gauge({ label, value, unit, color, min = 0, max = 100 }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ height: '4px', background: '#1e3a5f', borderRadius: '999px', marginBottom: '0.4rem' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: '999px', transition: 'width 0.5s ease', boxShadow: `0 0 6px ${color}80` }} />
      </div>
      <div style={{ fontWeight: 800, fontSize: '1.3rem', color }}>{value}<span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.2rem' }}>{unit}</span></div>
    </div>
  );
}

export default function IotMonitor() {
  const { user } = useAuth();
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState([]);
  const histRef = useRef([]);
  const isHardwarePlan = HARDWARE_PLANS.includes(user?.plan);

  useEffect(() => {
    if (!isHardwarePlan) return;
    const fetch = async () => {
      const r = await axios.get('/api/iot/live');
      setLive(r.data);
      const pt = { t: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), power: r.data.power, voltage: r.data.voltage };
      histRef.current = [...histRef.current.slice(-29), pt];
      setHistory([...histRef.current]);
    };
    fetch();
    const iv = setInterval(fetch, 2000);
    return () => clearInterval(iv);
  }, [isHardwarePlan]);

  // Not available for virtual plan
  if (!isHardwarePlan) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>IoT Monitoring</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Real-time equipment sensor data</p>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Lock size={40} color="#4a6080" style={{ margin: '0 auto 1.25rem' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#64748b', marginBottom: '0.5rem' }}>IoT Monitoring not included in your plan</div>
          <div style={{ color: '#4a6080', fontSize: '0.82rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Real-time solar monitoring — voltage, current, power output, panel temperature, and battery level — requires an on-site installation.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ id: 'rooftop', name: 'Rooftop Solar', price: '₹1,999/mo', color: '#22c55e' }, { id: 'hybrid', name: 'Hybrid Pro', price: '₹2,999/mo', color: '#a855f7' }].map(p => (
              <a key={p.id} href="/plans" style={{ background: `${p.color}15`, border: `1px solid ${p.color}40`, color: p.color, padding: '0.65rem 1.25rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {p.name} · {p.price} <ChevronRight size={13} />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>IoT Monitoring</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Live sensor data · Updates every 2s</p>
        </div>
        <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} /> Live
        </span>
      </div>

      {live && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <Gauge label="Voltage" value={live.voltage} unit="V" color="#00d4aa" min={210} max={250} />
            <Gauge label="Current" value={live.current} unit="A" color="#f59e0b" min={0} max={40} />
            <Gauge label="Power Output" value={live.power} unit="kW" color="#a855f7" min={0} max={10} />
            <Gauge label="Frequency" value={live.frequency} unit="Hz" color="#22c55e" min={49} max={51} />
            <Gauge label="Power Factor" value={live.powerFactor} unit="" color="#3b82f6" min={0.8} max={1} />
            <Gauge label="Panel Temp" value={live.temperature} unit="°C" color="#ef4444" min={25} max={70} />
            {live.batteryLevel !== null && <Gauge label="Battery" value={live.batteryLevel} unit="%" color="#22c55e" min={0} max={100} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="glass-card">
              <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Activity size={15} color="#a855f7" /> Power Output (kW)
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="t" stroke="#4a6080" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis stroke="#4a6080" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="power" stroke="#a855f7" fill="url(#gradP)" strokeWidth={2} dot={false} animationDuration={400} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card">
              <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Zap size={15} color="#00d4aa" /> Voltage (V)
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="t" stroke="#4a6080" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis stroke="#4a6080" tick={{ fontSize: 9 }} domain={[210, 240]} />
                  <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="voltage" stroke="#00d4aa" fill="url(#gradV)" strokeWidth={2} dot={false} animationDuration={400} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: '1.25rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { l: 'Daily Yield', v: `${live.dailyYield} kWh`, c: '#00d4aa' },
              { l: 'Grid Status', v: live.gridStatus === 'connected' ? '🟢 Connected' : '🔴 Offline', c: live.gridStatus === 'connected' ? '#22c55e' : '#ef4444' },
              { l: 'Instantaneous Power', v: `${live.power} kW`, c: '#a855f7' },
            ].map(item => (
              <div key={item.l}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem' }}>{item.l}</div>
                <div style={{ fontWeight: 700, color: item.c }}>{item.v}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
