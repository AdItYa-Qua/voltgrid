import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wifi, WifiOff, AlertTriangle, Lock } from 'lucide-react';

const STATUS_COLOR = { Online: '#22c55e', Warning: '#f59e0b', Offline: '#ef4444' };

export default function ProsumerDevices() {
  const [data, setData] = useState(null);

  useEffect(() => { axios.get('/api/prosumer/devices').then(r => setData(r.data)); }, []);

  if (!data) return <div style={{ padding: '5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  if (!data.live) {
    return (
      <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', paddingTop: '5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Devices</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Your equipment network</p>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Lock size={40} color="#4a6080" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#64748b', fontSize: '1rem', marginBottom: '0.5rem' }}>Device monitoring unlocks after activation</div>
          <div style={{ color: '#4a6080', fontSize: '0.82rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
            {data.message || 'Once your net meter is activated by the DISCOM, you\'ll see real-time device health, inverter data, and battery status here.'}
          </div>
        </div>
      </div>
    );
  }

  const offline = data.devices.filter(d => d.status === 'Offline');

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Devices</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{data.devices.length} devices in network</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
          {['Online','Warning','Offline'].map(s => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[s], display: 'inline-block' }} /> {s}
            </span>
          ))}
        </div>
      </div>

      {offline.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <div style={{ fontSize: '0.82rem' }}><strong style={{ color: '#ef4444' }}>{offline.length} device(s) offline:</strong> <span style={{ color: '#94a3b8' }}>{offline.map(d => d.name).join(', ')}. Schedule maintenance in Appointments.</span></div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.devices.map(device => {
          const color = STATUS_COLOR[device.status];
          const timeAgo = (() => {
            const d = Math.floor((Date.now() - new Date(device.lastSeen).getTime()) / 1000);
            if (d < 60) return `${d}s ago`;
            if (d < 3600) return `${Math.floor(d / 60)}m ago`;
            return `${Math.floor(d / 3600)}h ago`;
          })();
          return (
            <div key={device.id} className="glass-card" style={{ border: `1px solid ${device.status === 'Offline' ? 'rgba(239,68,68,0.2)' : device.status === 'Warning' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.1)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    {device.status === 'Offline' ? <WifiOff size={15} color="#ef4444" /> : <Wifi size={15} color={color} />}
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{device.name}</span>
                    <span style={{ background: `${color}22`, color, fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', border: `1px solid ${color}44` }}>{device.status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{device.model} · FW {device.firmware}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#4a6080' }}>Last seen: {timeAgo}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '6px', background: '#1e3a5f', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${device.health}%`, background: device.health > 80 ? '#22c55e' : device.health > 50 ? '#f59e0b' : '#ef4444', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: device.health > 80 ? '#22c55e' : device.health > 50 ? '#f59e0b' : '#ef4444', width: '35px', textAlign: 'right' }}>{device.health}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
