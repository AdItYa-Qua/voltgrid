import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, TreePine, Car, Share2, Copy, CheckCheck } from 'lucide-react';

export default function Carbon() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get('/api/consumer/carbon').then(r => setData(r.data));
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(`🌿 I've saved ${data.totalSaved} kg of CO₂ with @VoltGrid — the clean energy subscription platform. Join me! #CleanEnergy #VoltGrid`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!data) return <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Carbon Impact</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Your environmental contribution since joining VoltGrid</p>
      </div>

      {/* Hero stat */}
      <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,170,0.08))', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center', boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(34,197,94,0.2)', borderRadius: '50%', padding: '16px', marginBottom: '1rem' }}>
          <Leaf size={32} color="#22c55e" />
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{data.totalSaved}</div>
        <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 500 }}>kg CO₂ saved since subscription start</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>That's equivalent to driving {data.kmNotDriven.toLocaleString()} km less in a petrol car</div>
      </div>

      {/* Impact equivalents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <TreePine size={24} color="#22c55e" />, value: data.treesEquivalent, label: 'Trees Planted Equivalent', color: '#22c55e' },
          { icon: <Car size={24} color="#00d4aa" />, value: data.carsEquivalent, label: 'Cars Off Road Equivalent', color: '#00d4aa' },
          { icon: <Leaf size={24} color="#a855f7" />, value: `${data.kmNotDriven.toLocaleString()} km`, label: 'Kilometers Not Driven', color: '#a855f7' },
        ].map(item => (
          <div key={item.label} className="glass-card" style={{ textAlign: 'center', boxShadow: `0 0 20px ${item.color}18` }}>
            <div style={{ display: 'inline-flex', background: `${item.color}18`, borderRadius: '10px', padding: '10px', marginBottom: '0.75rem' }}>{item.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf size={16} color="#22c55e" /> Monthly CO₂ Reduction Trend
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="month" stroke="#4a6080" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} kg`, 'CO₂ Saved']} contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
            <Bar dataKey="co2" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Share badge */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(0,212,170,0.08))', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={16} color="#a855f7" /> Share Your Carbon Badge
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Let others know about your clean energy impact</div>
        </div>
        <button onClick={handleShare} className="btn-teal" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
          {copied ? <><CheckCheck size={16} /> Copied!</> : <><Copy size={16} /> Copy Badge</>}
        </button>
      </div>
    </div>
  );
}
