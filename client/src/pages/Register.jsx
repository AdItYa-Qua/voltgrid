import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Zap, Mail, Lock, User, Phone, Gift, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', referralCode: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { addToast('Passwords do not match', 'error'); return; }
    if (form.password.length < 6) { addToast('Password must be at least 6 characters', 'error'); return; }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) { addToast('Enter a valid 10-digit Indian mobile number', 'error'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.phone);
      navigate('/select-role');
    } catch (err) {
      addToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at center top, rgba(0,212,170,0.08) 0%, #0a0f1e 60%)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', borderRadius: '16px', padding: '14px', marginBottom: '1rem' }}>
            <Zap size={28} color="#060d1f" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltGrid</h1>
          <p style={{ color: '#4a6080', fontSize: '0.875rem' }}>Join the clean energy revolution</p>
        </div>

        <div className="glass-card" style={{ boxShadow: '0 0 40px rgba(0,212,170,0.08)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create account</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4a6080' }} />
                <input type="text" placeholder="Arjun Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ paddingLeft: '36px' }} />
              </div>
            </div>
            <div>
              <label>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4a6080' }} />
                <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ paddingLeft: '36px' }} />
              </div>
            </div>
            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4a6080' }} />
                <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingLeft: '36px', paddingRight: '36px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a6080', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label>Confirm password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4a6080' }} />
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required style={{ paddingLeft: '36px' }} />
              </div>
            </div>

            <button type="submit" className="btn-teal" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4a6080' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00d4aa', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
