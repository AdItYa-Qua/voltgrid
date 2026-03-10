import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap, ArrowRight, ChevronRight, Sun, Battery, TrendingUp,
  Shield, Cpu, Leaf, Users, Home, Building2, PlayCircle,
  BarChart2, Bolt, Globe, CheckCircle, Star
} from 'lucide-react';
import './LandingPage.css';

/* ─────────────────────────────────────────────
   Scroll-reveal hook
───────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   Parallax hook for hero image
───────────────────────────────────────────── */
function useParallax(ref, speed = 0.15) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const scrollY = window.scrollY;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref, speed]);
}

/* ─────────────────────────────────────────────
   Navbar
───────────────────────────────────────────── */
function LPNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      {/* Logo */}
      <a href="#hero" className="lp-nav-logo">
        <div className="lp-nav-logo-icon">
          <Zap size={20} color="#060d1f" strokeWidth={2.5} />
        </div>
        <span className="lp-nav-logo-text">VoltGrid</span>
      </a>

      {/* Center links */}
      <ul className="lp-nav-links">
        <li><a href="#eaas">EaaS Model</a></li>
        <li><a href="#workflow">How It Works</a></li>
        <li><a href="#users">For You</a></li>
        <li><a href="#features">Features</a></li>
      </ul>

      {/* CTA buttons – top-right */}
      <div className="lp-nav-actions">
        <Link to="/login" className="lp-btn-ghost">Sign In</Link>
        <Link to="/register" className="lp-btn-primary">
          Get Started <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Ticker
───────────────────────────────────────────── */
const tickerItems = [
  { label: 'Solar Energy Traded', val: '2.4 GWh' },
  { label: 'Active Prosumers', val: '18,400+' },
  { label: 'CO₂ Saved', val: '9,200 T' },
  { label: 'Grid Uptime', val: '99.7%' },
  { label: 'Avg. Bill Reduction', val: '28%' },
  { label: 'Cities Covered', val: '14' },
  { label: 'Energy Plans', val: '5 Tiers' },
  { label: 'IoT Devices Connected', val: '52,000+' },
];
function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="lp-ticker-wrap">
      <div className="lp-ticker-inner">
        {doubled.map((t, i) => (
          <span key={i} className="lp-ticker-item">
            <Zap size={12} color="#00d4aa" />
            {t.label}: <span>{t.val}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero Section
───────────────────────────────────────────── */
function Hero() {
  const imgRef = useRef(null);
  useParallax(imgRef, 0.1);

  return (
    <section id="hero" className="lp-hero">
      <div className="lp-hero-bg-grid" />
      <div className="lp-container">
        <div className="lp-hero-inner">
          {/* Left column */}
          <div>
            <div className="lp-hero-badge">
              <Sun size={14} /> India's First EaaS Platform
            </div>
            <h1 className="lp-hero-title">
              Energy delivered as a
              <span className="accent">Service.</span>
            </h1>
            <p className="lp-hero-desc">
              VoltGrid connects solar prosumers, consumers, and RWAs on a single
              intelligent grid. Buy, sell, and manage clean energy — predictably,
              transparently, and at scale.
            </p>
            <div className="lp-hero-btns">
              <Link to="/register" className="lp-hero-btn-main">
                Start for Free <ArrowRight size={18} />
              </Link>
              <a href="#workflow" className="lp-hero-btn-sec">
                <PlayCircle size={18} /> See How It Works
              </a>
            </div>
            <div className="lp-hero-stats">
              <div>
                <div className="lp-hero-stat-val">18k+</div>
                <div className="lp-hero-stat-lbl">Prosumers</div>
              </div>
              <div>
                <div className="lp-hero-stat-val">₹2.4Cr</div>
                <div className="lp-hero-stat-lbl">Earnings Generated</div>
              </div>
              <div>
                <div className="lp-hero-stat-val">9,200T</div>
                <div className="lp-hero-stat-lbl">CO₂ Offset</div>
              </div>
            </div>
          </div>

          {/* Right – hero image with parallax */}
          <div className="lp-hero-img-wrap">
            <div className="lp-hero-glow" />
            <div className="lp-parallax-wrap">
              <img
                ref={imgRef}
                src={`${import.meta.env.BASE_URL}hero-grid.png`}
                alt="VoltGrid energy network illustration"
                className="lp-parallax-img lp-hero-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   What is EaaS?
───────────────────────────────────────────── */
const benefits = [
  {
    icon: '⚡',
    color: '#00d4aa',
    bg: 'rgba(0,212,170,0.1)',
    title: 'Zero Infrastructure Cost',
    desc: 'No capex. Subscribe to a plan and get clean energy delivered straight to your meter — we handle all grid infrastructure.',
  },
  {
    icon: '📊',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    title: 'Real-Time Energy Monitoring',
    desc: 'Track live consumption, generation, and grid health via our IoT dashboard. Know exactly what you use and when.',
  },
  {
    icon: '🌱',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    title: 'Carbon Footprint Tracking',
    desc: 'Automated carbon credits and sustainability reports. Meet ESG goals effortlessly.',
  },
  {
    icon: '💡',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    title: 'Dynamic Pricing Engine',
    desc: 'AI-driven, time-of-use pricing aligned with DISCOM regulations. Always pay a fair, transparent rate.',
  },
  {
    icon: '🔁',
    color: '#00d4aa',
    bg: 'rgba(0,212,170,0.1)',
    title: 'Peer-to-Peer Trading',
    desc: 'Prosumers sell excess solar power directly to neighbours. Community-driven clean energy market.',
  },
  {
    icon: '🛡️',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    title: 'Guaranteed SLA Reliability',
    desc: '99.7% grid uptime SLA backed by battery storage buffers and predictive outage management.',
  },
];

function EaaSSection() {
  return (
    <section id="eaas" className="lp-section lp-benefits-bg">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-tag reveal"><Leaf size={13} /> Energy-as-a-Service</div>
          <h2 className="lp-heading reveal">
            What is the <span>EaaS Model</span>?
          </h2>
          <p className="lp-subtext reveal" style={{ margin: '0 auto' }}>
            Energy-as-a-Service (EaaS) replaces the outdated buy-and-own energy model with a
            flexible subscription. You pay for the energy you use — clean, structured, and smart.
            VoltGrid owns and operates the grid; you enjoy the electricity.
          </p>
        </div>

        <div className="lp-benefits-grid">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`lp-benefit-card reveal reveal-delay-${(i % 3) + 1}`}
              style={{ '--card-color': b.color }}
            >
              <div className="lp-benefit-icon" style={{ background: b.bg, color: b.color }}>
                {b.icon}
              </div>
              <div className="lp-benefit-title">{b.title}</div>
              <div className="lp-benefit-desc">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   How It Works – Workflow
───────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    icon: '📝',
    color: '#00d4aa',
    bg: 'rgba(0,212,170,0.12)',
    border: '#00d4aa',
    title: 'Sign Up & Choose Role',
    desc: 'Register as a Consumer, Prosumer, or RWA. Pick an energy plan suited to your needs.',
  },
  {
    num: '02',
    icon: '🔌',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: '#a855f7',
    title: 'Onboard & Connect',
    desc: 'Schedule a technician visit. We install smart meters and IoT devices within 24–48 hours.',
  },
  {
    num: '03',
    icon: '☀️',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: '#f59e0b',
    title: 'Generate or Consume',
    desc: 'Prosumers inject solar power into the VoltGrid. Consumers draw clean energy on demand.',
  },
  {
    num: '04',
    icon: '📉',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: '#22c55e',
    title: 'Trade & Earn',
    desc: 'Excess energy is matched to buyers instantly. Prosumers earn real-time credits & cash.',
  },
  {
    num: '05',
    icon: '💰',
    color: '#00d4aa',
    bg: 'rgba(0,212,170,0.12)',
    border: '#00d4aa',
    title: 'Pay & Withdraw',
    desc: 'Monthly transparent bills for consumers. Instant UPI withdrawals for prosumer earnings.',
  },
];

function WorkflowSection() {
  return (
    <section id="workflow" className="lp-section lp-workflow-bg">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-tag reveal"><Cpu size={13} /> Platform Workflow</div>
          <h2 className="lp-heading reveal">
            How <span>VoltGrid</span> Works
          </h2>
          <p className="lp-subtext reveal" style={{ margin: '0 auto' }}>
            From onboarding to trading — our end-to-end automated platform makes clean energy
            participation effortless for everyone.
          </p>
        </div>

        <div className="lp-workflow-grid">
          {steps.map((s, i) => (
            <div key={i} className={`lp-step reveal reveal-delay-${i + 1}`}>
              <div
                className="lp-step-num"
                style={{
                  background: s.bg,
                  color: s.color,
                  borderColor: s.border,
                  boxShadow: `0 0 24px ${s.bg}`,
                  fontSize: '1.8rem',
                }}
              >
                {s.icon}
              </div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Diagram: flow visual */}
        <div className="reveal" style={{ marginTop: '4rem' }}>
          <div style={{
            background: 'rgba(15,23,41,0.9)',
            border: '1px solid rgba(0,212,170,0.15)',
            borderRadius: '20px',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr auto 1fr',
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            {/* Prosumer Block */}
            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(245,158,11,0.08)', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☀️🏠</div>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>Prosumer</div>
              <div style={{ color: '#4a6080', fontSize: '0.78rem', marginTop: '0.25rem' }}>Generates solar surplus</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowRight size={20} color="#00d4aa" />
              <span style={{ fontSize: '0.7rem', color: '#4a6080' }}>injects</span>
            </div>

            {/* VoltGrid Block */}
            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(0,212,170,0.08)', borderRadius: '14px', border: '1px solid rgba(0,212,170,0.25)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡🔁</div>
              <div style={{ color: '#00d4aa', fontWeight: 800, fontSize: '0.95rem' }}>VoltGrid Platform</div>
              <div style={{ color: '#4a6080', fontSize: '0.78rem', marginTop: '0.25rem' }}>Smart matching engine + IoT</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowRight size={20} color="#22c55e" />
              <span style={{ fontSize: '0.7rem', color: '#4a6080' }}>delivers</span>
            </div>

            {/* Consumer Block */}
            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(168,85,247,0.08)', borderRadius: '14px', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢🏡</div>
              <div style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.95rem' }}>Consumer / RWA</div>
              <div style={{ color: '#4a6080', fontSize: '0.78rem', marginTop: '0.25rem' }}>Gets clean energy on subscription</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   User Personas
───────────────────────────────────────────── */
const personas = [
  {
    emoji: '🏠',
    title: 'Consumer',
    sub: 'Households & individuals',
    color: '#a855f7',
    perks: [
      'Fixed monthly energy subscription plans',
      'Real-time IoT power monitoring dashboard',
      'Automated billing & payment history',
      'Carbon footprint tracker & green credits',
      'Seamless technician appointment booking',
    ],
  },
  {
    emoji: '☀️',
    title: 'Prosumer',
    sub: 'Solar panel owners who sell surplus',
    color: '#00d4aa',
    perks: [
      'Sell surplus solar energy on VoltGrid',
      'Live earnings dashboard & UPI withdrawal',
      'Device & inverter management panel',
      'Grid injection tracking per time slot',
      'Monthly performance analytics report',
    ],
  },
  {
    emoji: '🏢',
    title: 'RWA / Society',
    sub: 'Housing societies & commercial buildings',
    color: '#f59e0b',
    perks: [
      'Bulk energy plans for entire societies',
      'Common area IoT monitoring',
      'Shared solar rooftop revenue sharing',
      'Resident-level consumption breakdown',
      'Priority 24/7 grid support SLA',
    ],
  },
];

function PersonasSection() {
  return (
    <section id="users" className="lp-section lp-personas">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-tag reveal"><Users size={13} /> Built For Everyone</div>
          <h2 className="lp-heading reveal">
            Which <span>Role</span> are You?
          </h2>
          <p className="lp-subtext reveal" style={{ margin: '0 auto' }}>
            VoltGrid serves the full spectrum — from individual households to large housing
            societies and solar prosumers. Pick your role and get started in minutes.
          </p>
        </div>

        <div className="lp-personas-grid">
          {personas.map((p, i) => (
            <div key={i} className={`lp-persona-card reveal reveal-delay-${i + 1}`}
              style={{
                borderColor: `${p.color}22`,
                background: `linear-gradient(160deg, rgba(15,23,41,0.95) 60%, ${p.color}0a 100%)`,
              }}
            >
              <span className="lp-persona-avatar">{p.emoji}</span>
              <div className="lp-persona-title" style={{ color: p.color }}>{p.title}</div>
              <div className="lp-persona-sub">{p.sub}</div>
              <ul className="lp-persona-perks">
                {p.perks.map((perk, j) => <li key={j}>{perk}</li>)}
              </ul>
              <Link to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: `${p.color}18`,
                  border: `1px solid ${p.color}44`,
                  color: p.color,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${p.color}28`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${p.color}18`; }}
              >
                Join as {p.title} <ChevronRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Features
───────────────────────────────────────────── */
const features = [
  { ico: '📡', title: 'Live IoT Dashboard', desc: 'Monitor voltage, current, and energy flow in real time with sub-second updates from smart meters.' },
  { ico: '🔋', title: 'Battery Buffer Storage', desc: 'Integrated BESS ensures stable supply during peak demand or outages — zero interruptions.' },
  { ico: '🤖', title: 'AI Load Forecasting', desc: 'Our ML models predict consumption patterns for efficient grid dispatch and cost minimisation.' },
  { ico: '📑', title: 'AUTO Bill Generation', desc: 'Dynamic tariff-aware billing auto-generated each month per DISCOM guidelines.' },
  { ico: '🌍', title: 'Carbon Credit Reports', desc: 'Get verified ESG reports and carbon offset certificates for your organisation.' },
  { ico: '📅', title: 'Technician Scheduling', desc: 'Book on-site appointments for installation, maintenance, or device checks from the app.' },
  { ico: '🔐', title: 'Role-based Security', desc: 'Separate access controls and dashboards for Consumers, Prosumers, and RWA admins.' },
  { ico: '📲', title: 'UPI Instant Withdrawal', desc: 'Prosumer earnings land in your bank account via UPI within 2 business days.' },
  { ico: '🏆', title: 'Referral Rewards', desc: 'Earn ₹200/referral when your friends join VoltGrid — no cap on earnings.' },
];

function FeaturesSection() {
  return (
    <section id="features" className="lp-section lp-features-bg">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-tag reveal"><Star size={13} /> Platform Features</div>
          <h2 className="lp-heading reveal">
            Everything in <span>One Platform</span>
          </h2>
          <p className="lp-subtext reveal" style={{ margin: '0 auto' }}>
            A comprehensive suite of tools for every energy stakeholder — from smart metering
            to AI-powered analytics.
          </p>
        </div>

        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div key={i} className={`lp-feature-row reveal reveal-delay-${(i % 3) + 1}`}>
              <div className="lp-feature-ico">{f.ico}</div>
              <div>
                <div className="lp-feature-ttl">{f.title}</div>
                <div className="lp-feature-dsc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA Banner
───────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="lp-cta">
      <div className="reveal">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
        <h2 className="lp-cta-title">
          Ready to power up with <span style={{ background: 'linear-gradient(135deg,#00d4aa,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VoltGrid</span>?
        </h2>
        <p className="lp-cta-sub">
          Join thousands of households and prosumers already saving on bills and earning from solar energy.
        </p>
        <div className="lp-cta-btns">
          <Link to="/register" className="lp-hero-btn-main">
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="lp-hero-btn-sec">
            Sign In to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg,#00d4aa,#22c55e)', borderRadius: '8px', padding: '5px', display: 'flex' }}>
          <Zap size={14} color="#060d1f" strokeWidth={2.5} />
        </div>
        <span style={{ color: '#334155', fontWeight: 700 }}>VoltGrid</span>
      </div>
      <p>© {new Date().getFullYear()} VoltGrid Pvt. Ltd. · Energy-as-a-Service Platform · India</p>
      <p style={{ marginTop: '0.25rem' }}>
        <Link to="/login" style={{ color: '#1e3a5f', textDecoration: 'none' }}>Sign In</Link>
        {' · '}
        <Link to="/register" style={{ color: '#1e3a5f', textDecoration: 'none' }}>Register</Link>
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   Main Page Export
───────────────────────────────────────────── */
export default function LandingPage() {
  useReveal();

  return (
    <div style={{ overflowX: 'hidden' }}>
      <LPNavbar />
      <Hero />
      <Ticker />
      <EaaSSection />
      <WorkflowSection />
      <PersonasSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
