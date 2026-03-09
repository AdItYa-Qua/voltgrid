import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, X, Zap, LogOut, User } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import axios from 'axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  const consumerLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/plans', label: 'Plans' },
    { to: '/iot', label: 'IoT Monitor' },
    { to: '/carbon', label: 'Carbon' },
    { to: '/billing', label: 'Billing' },
    { to: '/appointments', label: 'Schedule' },
    { to: '/referral', label: '🎁 Refer & Earn' },
    { to: '/support', label: 'Support' },
  ];

  const prosumerLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/devices', label: 'Devices' },
    { to: '/earnings', label: 'Earnings' },
    { to: '/appointments', label: 'Schedule' },
    { to: '/support', label: 'Support' },
  ];

  const links = user?.role === 'prosumer' ? prosumerLinks : consumerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    axios.get('/api/notifications').then(r => {
      setUnreadCount(r.data.filter(n => !n.read).length);
    }).catch(() => {});
  }, []);

  const isActive = (to) => location.pathname === to;

  return (
    <>
      <nav style={{ background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,212,170,0.15)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '64px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #00d4aa, #22c55e)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
              <Zap size={18} color="#060d1f" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltGrid</span>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} className="hidden md:flex">
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{
                padding: '0.375rem 0.875rem', borderRadius: '8px', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: 500,
                color: isActive(l.to) ? '#00d4aa' : '#94a3b8',
                background: isActive(l.to) ? 'rgba(0,212,170,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive(l.to)) e.target.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (!isActive(l.to)) e.target.style.color = '#94a3b8'; }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right — Notifications + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotiOpen(!notiOpen)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '8px', padding: '6px', display: 'flex', cursor: 'pointer', color: '#94a3b8', position: 'relative' }} aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notiOpen && <NotificationDropdown onClose={() => { setNotiOpen(false); setUnreadCount(0); }} />}
            </div>

            {/* User badge — desktop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hidden md:flex">
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: '8px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={15} color="#00d4aa" />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0' }}>{user?.name || user?.email?.split('@')[0]}</span>
                <span className={`badge ${user?.role === 'prosumer' ? 'badge-purple' : 'badge-teal'}`}>{user?.role || 'user'}</span>
              </div>
              <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px', display: 'flex', cursor: 'pointer', color: '#ef4444' }} title="Logout">
                <LogOut size={16} />
              </button>
            </div>

            {/* Hamburger — mobile */}
            <button onClick={() => setDrawerOpen(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', display: 'none', cursor: 'pointer', color: '#94a3b8' }} className="mobile-menu-btn" aria-label="Menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #00d4aa, #22c55e)', borderRadius: '6px', padding: '4px', display: 'flex' }}>
                  <Zap size={14} color="#060d1f" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltGrid</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '2rem' }}>
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setDrawerOpen(false)} style={{
                  padding: '0.625rem 0.875rem', borderRadius: '8px', textDecoration: 'none',
                  fontSize: '0.9rem', fontWeight: 500,
                  color: isActive(l.to) ? '#00d4aa' : '#94a3b8',
                  background: isActive(l.to) ? 'rgba(0,212,170,0.12)' : 'transparent',
                }}>{l.label}</Link>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #1e3a5f', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <User size={15} color="#00d4aa" />
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{user?.name}</span>
                <span className={`badge ${user?.role === 'prosumer' ? 'badge-purple' : 'badge-teal'}`}>{user?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile menu display fix */}
      <style>{`
        @media (max-width: 768px) {
          .hidden { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
