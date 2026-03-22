import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bell, X, Zap, CreditCard, Calendar, AlertTriangle, Car, Sun } from 'lucide-react';

const icons = {
  outage: <AlertTriangle size={14} color="#ef4444" />,
  billing: <CreditCard size={14} color="#00d4aa" />,
  appointment: <Calendar size={14} color="#22c55e" />,
  device: <Zap size={14} color="#f59e0b" />,
  ev: <Car size={14} color="#00d4aa" />,
};

const evMockNotifs = [
  { id: 'ev-1', type: 'ev', message: 'Smart charging complete. Your EV charged 18.4 kWh \u2014 82% from solar. Cost: \u20B955', time: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'ev-2', type: 'ev', message: 'Solar peak starting. Smart charging activated for your EV.', time: new Date(Date.now() - 10800000).toISOString(), read: true },
];

export default function NotificationDropdown({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const ref = useRef();

  useEffect(() => {
    axios.get('/api/notifications').then(r => setNotifs([...evMockNotifs, ...r.data]));
    axios.post('/api/notifications/mark-read');
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px',
      background: '#0f1729', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 999, overflow: 'hidden',
    }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={16} color="#00d4aa" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a6080', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#4a6080' }}>No notifications</div>
        ) : notifs.map(n => (
          <div key={n.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', background: n.read ? 'transparent' : 'rgba(0,212,170,0.04)' }}>
            <div style={{ marginTop: '2px' }}>{icons[n.type] || <Bell size={14} />}</div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>{n.message}</p>
              <p style={{ fontSize: '0.7rem', color: '#4a6080', marginTop: '0.25rem' }}>{timeAgo(n.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
