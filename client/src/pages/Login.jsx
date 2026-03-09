import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (!user.role) {
        navigate('/select-role');
      } else if (!user.onboarded) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at center top, rgba(0,212,170,0.08) 0%, #0a0f1e 60%)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', borderRadius: '16px', padding: '14px', marginBottom: '1rem' }}>
            <Zap size={28} color="#060d1f" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', background: 'linear-gradient(135deg, #00d4aa, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltGrid</h1>
          <p style={{ color: '#4a6080', fontSize: '0.875rem', marginTop: '0.25rem' }}>Clean energy, predictably delivered</p>
        </div>

        <div className="glass-card" style={{ boxShadow: '0 0 40px rgba(0,212,170,0.08)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', color: '#e2e8f0' }}>Welcome back</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingLeft: '36px', paddingRight: '36px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a6080', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-teal" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#4a6080' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00d4aa', fontWeight: 600, textDecoration: 'none' }}>Create one →</Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: '1rem', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#4a6080', textAlign: 'center' }}>
          💡 New here? <Link to="/register" style={{ color: '#00d4aa', textDecoration: 'none' }}>Register</Link> and pick Consumer or Prosumer role
        </div>
      </div>
    </div>
  );
}
