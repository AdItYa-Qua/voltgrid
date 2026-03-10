// ─── Mock Backend for GitHub Pages ───────────────────────────────────
// Runs entirely in the browser. Uses localStorage for persistence.
// Activated only in production when VITE_API_URL is not set.
import axios from 'axios';

/* ═══ Helpers ═══ */
const ls = (k) => JSON.parse(localStorage.getItem('vg_' + k) || 'null');
const ss = (k, v) => localStorage.setItem('vg_' + k, JSON.stringify(v));
const gid = () => Math.random().toString(36).substr(2, 9);
const ok = (data) => ({ status: 200, data });
const err = (s, e) => ({ status: s, data: { error: e } });

/* ═══ Storage ═══ */
const db = {
  get users() { return ls('users') || []; },
  set users(v) { ss('users', v); },
  get nextId() { return ls('nextId') || 1; },
  set nextId(v) { ss('nextId', v); },
  get appts() { return ls('appts') || []; },
  set appts(v) { ss('appts', v); },
  get tickets() { return ls('tickets') || []; },
  set tickets(v) { ss('tickets', v); },
  get notifs() { return ls('notifs') || {}; },
  set notifs(v) { ss('notifs', v); },
};

/* ═══ Token (base64, no real JWT needed) ═══ */
const makeToken = (u) => btoa(JSON.stringify({ id: u.id, email: u.email }));
const parseToken = (h) => { if (!h) return null; try { return JSON.parse(atob(h.replace('Bearer ', ''))); } catch { return null; } };
const findUser = (auth) => auth ? db.users.find(u => u.id === auth.id) : null;
const updateUser = (id, fn) => { const users = db.users; const u = users.find(x => x.id === id); if (u) fn(u); db.users = users; return u; };

/* ═══ Static Data (mirrored from server) ═══ */
const STATE_DATA = {
  'Maharashtra': { fit: 2.90, vnm: true, appc: 2.90, subsidy: 78000, discom: 'MSEDCL', avgTariff: 8.50, peakHours: '6pm-10pm' },
  'Delhi': { fit: 3.00, vnm: true, appc: 3.00, subsidy: 78000, discom: 'BSES/TPDDL', avgTariff: 7.20, peakHours: '6pm-10pm' },
  'Karnataka': { fit: 3.82, vnm: true, appc: 3.82, subsidy: 78000, discom: 'BESCOM', avgTariff: 7.80, peakHours: '6pm-10pm' },
  'Tamil Nadu': { fit: 3.10, vnm: false, appc: 3.10, subsidy: 78000, discom: 'TANGEDCO', avgTariff: 6.50, peakHours: '6pm-10pm' },
  'Gujarat': { fit: 2.25, vnm: false, appc: 2.25, subsidy: 78000, discom: 'DGVCL/MGVCL', avgTariff: 5.50, peakHours: '6pm-10pm' },
  'Rajasthan': { fit: 3.26, vnm: false, appc: 3.26, subsidy: 78000, discom: 'JVVNL/AVVNL', avgTariff: 7.00, peakHours: '6pm-10pm' },
  'Telangana': { fit: 2.80, vnm: false, appc: 2.80, subsidy: 78000, discom: 'TSSPDCL/TSNPDCL', avgTariff: 6.80, peakHours: '6pm-10pm' },
  'Andhra Pradesh': { fit: 2.09, vnm: false, appc: 2.09, subsidy: 78000, discom: 'APSPDCL/APEPDCL', avgTariff: 6.20, peakHours: '6pm-10pm' },
  'Uttar Pradesh': { fit: 2.98, vnm: false, appc: 2.98, subsidy: 78000, discom: 'UPPCL', avgTariff: 6.90, peakHours: '6pm-10pm' },
  'West Bengal': { fit: 2.09, vnm: false, appc: 2.09, subsidy: 78000, discom: 'WBSEDCL/CESC', avgTariff: 7.10, peakHours: '6pm-10pm' },
  'Madhya Pradesh': { fit: 2.14, vnm: false, appc: 2.14, subsidy: 78000, discom: 'MPEZ/MPMKVVCL', avgTariff: 6.40, peakHours: '6pm-10pm' },
  'Kerala': { fit: 3.15, vnm: false, appc: 3.15, subsidy: 78000, discom: 'KSEB', avgTariff: 5.80, peakHours: '6pm-10pm' },
  'Punjab': { fit: 2.65, vnm: false, appc: 2.65, subsidy: 78000, discom: 'PSPCL', avgTariff: 7.50, peakHours: '6pm-10pm' },
  'Haryana': { fit: 3.11, vnm: false, appc: 3.11, subsidy: 78000, discom: 'DHBVN/UHBVN', avgTariff: 7.30, peakHours: '6pm-10pm' },
  'Bihar': { fit: 3.11, vnm: false, appc: 3.11, subsidy: 78000, discom: 'BSPHCL', avgTariff: 6.60, peakHours: '6pm-10pm' },
};
const DEFAULT_STATE = { fit: 3.00, vnm: false, appc: 3.00, subsidy: 78000, discom: 'DISCOM', avgTariff: 7.00, peakHours: '6pm-10pm' };

const WEATHER = {
  'Mumbai': { condition: 'Partly Cloudy', irradiance: 4.8, factor: 0.85, icon: '🌤️' },
  'Delhi': { condition: 'Sunny', irradiance: 5.5, factor: 1.0, icon: '☀️' },
  'Bangalore': { condition: 'Sunny', irradiance: 5.2, factor: 0.95, icon: '☀️' },
  'Chennai': { condition: 'Hazy Sunny', irradiance: 5.0, factor: 0.92, icon: '🌞' },
  'Hyderabad': { condition: 'Sunny', irradiance: 5.4, factor: 0.98, icon: '☀️' },
  'Pune': { condition: 'Sunny', irradiance: 5.1, factor: 0.93, icon: '☀️' },
  'Jaipur': { condition: 'Sunny', irradiance: 5.8, factor: 1.0, icon: '☀️' },
  'Kolkata': { condition: 'Cloudy', irradiance: 4.2, factor: 0.75, icon: '⛅' },
  'Lucknow': { condition: 'Sunny', irradiance: 5.3, factor: 0.96, icon: '☀️' },
  'Ahmedabad': { condition: 'Sunny', irradiance: 5.7, factor: 1.0, icon: '☀️' },
  'default': { condition: 'Partly Cloudy', irradiance: 5.0, factor: 0.90, icon: '🌤️' },
};

const plans = [
  { id: 'virtual', name: 'Virtual Solar', price: 999, capacity: '3 kW', badge: 'VNM Required', description: 'Solar energy allocated from partner network farms. No rooftop needed.', vnmRequired: true, savings: { min: 400, max: 700 }, contractMonths: 12, cancellationFee: 0, sla: '99% uptime', responseTime: '48 hours', features: ['3 kW virtual allocation', 'Monthly bill credit', 'App-based monitoring', 'Green certificate', 'Email support'], color: 'teal' },
  { id: 'rooftop', name: 'Rooftop Solar', price: 1999, capacity: '5 kW', badge: 'Most Popular', description: 'On-site rooftop installation — zero upfront investment, managed by VoltGrid.', vnmRequired: false, savings: { min: 1000, max: 1800 }, contractMonths: 24, cancellationFee: 2999, sla: '99.5% uptime', responseTime: '24 hours', features: ['5 kW on-site system', 'Real-time IoT monitoring', '25-year panel warranty', 'Net metering handled', 'Priority support', 'Annual O&M included'], color: 'green' },
  { id: 'hybrid', name: 'Hybrid Pro', price: 2999, capacity: '8 kW + Battery', badge: 'Power Secure', description: '8kW solar + 10kWh battery storage. Outage-proof, EV-ready.', vnmRequired: false, savings: { min: 1800, max: 2800 }, contractMonths: 36, cancellationFee: 4999, sla: '99.9% + Battery backup', responseTime: '4 hours', features: ['8 kW solar + 10 kWh battery', '6-hour backup guarantee', 'EV charging ready', 'Outage auto-switch', 'Dedicated account manager', 'Priority onsite response', 'API access'], color: 'purple' },
  { id: 'society', name: 'Society / RWA Plan', price: 8999, capacity: '30 kW', badge: 'Group Plan', description: 'Group solar for housing societies, RWAs, and apartment complexes.', vnmRequired: false, savings: { min: 5000, max: 12000 }, contractMonths: 36, cancellationFee: 9999, sla: '99.9% uptime', responseTime: '4 hours', features: ['30 kW shared installation', 'Common area coverage', 'Per-unit sub-metering', 'Resident portal access', 'Society billing dashboard', 'Annual energy audit', 'DISCOM liaison handled'], color: 'orange', isGroup: true },
];

/* ═══ Notification push helper ═══ */
function pushNotif(userId, type, message) {
  const n = db.notifs; if (!n[userId]) n[userId] = [];
  n[userId].unshift({ id: gid(), type, message, read: false, time: new Date().toISOString() });
  db.notifs = n;
}

/* ═══ 7-day array helper ═══ */
function days7(fn) { return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return fn(d, i); }); }
function forecast7(fn) { return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return fn(d, i); }); }

/* ═══════════════════════════════════════════════
   Route Handler
═══════════════════════════════════════════════ */
function handle(config) {
  const m = (config.method || 'GET').toUpperCase();
  let p = config.url || '';
  if (p.startsWith('http')) try { p = new URL(p).pathname; } catch {}
  p = p.replace(/^\/voltgrid/, '');

  const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
  const auth = parseToken(config.headers?.Authorization);

  let match;

  // ─── AUTH ───
  if (m === 'POST' && p === '/api/auth/register') {
    const { email, password, name, phone } = body;
    const users = db.users;
    if (users.find(u => u.email === email)) return err(400, 'Email already registered');
    const id = db.nextId; db.nextId = id + 1;
    const rc = 'VG' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const user = { id, email, password, name: name || email.split('@')[0], phone: phone || '', role: null, plan: null, onboarded: false, onboardingData: null, prosumerData: null, state: null, homeType: null, referralCode: rc, referredBy: null, referralCount: 0, freeMonths: 0, evMode: false, systemLive: false, discountApplied: 0 };
    users.push(user); db.users = users;
    return ok({ token: makeToken(user), user: { id: user.id, email, name: user.name, role: null } });
  }

  if (m === 'POST' && p === '/api/auth/login') {
    const { email, password } = body;
    const user = db.users.find(u => u.email === email);
    if (!user || user.password !== password) return err(400, 'Invalid credentials');
    return ok({ token: makeToken(user), user: { id: user.id, email, name: user.name, role: user.role, plan: user.plan, onboarded: user.onboarded } });
  }

  if (m === 'POST' && p === '/api/auth/role') {
    const user = findUser(auth); if (!user) return err(404, 'Not found');
    updateUser(auth.id, u => { u.role = body.role; });
    return ok({ success: true, role: body.role });
  }

  if (m === 'GET' && p === '/api/auth/me') {
    const user = findUser(auth); if (!user) return err(404, 'Not found');
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, onboarded: user.onboarded, phone: user.phone, state: user.state, homeType: user.homeType, referralCode: user.referralCode, freeMonths: user.freeMonths, evMode: user.evMode, systemLive: user.systemLive });
  }

  // ─── STATE & SUBSIDY ───
  if (m === 'GET' && p === '/api/states') return ok(Object.keys(STATE_DATA));
  if (m === 'GET' && (match = p.match(/^\/api\/state\/(.+)$/))) return ok(STATE_DATA[decodeURIComponent(match[1])] || DEFAULT_STATE);

  if (m === 'POST' && p === '/api/subsidy/calculate') {
    const kw = parseFloat(body.capacityKw) || 3;
    const eligible = body.homeType !== 'commercial';
    let subsidy = 0;
    if (eligible) { if (kw <= 2) subsidy = 30000 * kw; else if (kw <= 3) subsidy = 60000 + 18000 * (kw - 2); else subsidy = 78000; }
    return ok({ eligible, subsidy, maxSubsidy: 78000, scheme: 'PM Surya Ghar: Muft Bijli Yojana', loanAvailable: eligible, loanRate: 7, processingTime: '4–8 weeks' });
  }

  // ─── CONSUMER PLANS ───
  if (m === 'GET' && p === '/api/consumer/plans') {
    const user = findUser(auth);
    const sd = STATE_DATA[user?.state] || DEFAULT_STATE;
    return ok({ plans, activePlan: user?.plan || null, stateData: sd, userState: user?.state });
  }

  if (m === 'POST' && p === '/api/consumer/subscribe') {
    const user = findUser(auth); if (!user) return err(404, 'Not found');
    updateUser(auth.id, u => { u.plan = body.planId; u.onboarded = true; });
    const pn = plans.find(pl => pl.id === body.planId)?.name;
    pushNotif(auth.id, 'billing', `🎉 Subscribed to ${pn}! Your installation survey is being scheduled.`);
    pushNotif(auth.id, 'appointment', '📅 Site survey scheduled. Your service engineer will contact you within 48 hours.');
    return ok({ success: true, plan: body.planId });
  }

  if (m === 'POST' && p === '/api/consumer/onboard') {
    updateUser(auth.id, u => { u.onboarded = true; u.onboardingData = body; u.state = body.state; u.homeType = body.homeType; });
    return ok({ success: true });
  }

  if (m === 'POST' && p === '/api/consumer/cancel') {
    const user = findUser(auth); if (!user) return err(404, 'Not found');
    const fee = plans.find(pl => pl.id === user.plan)?.cancellationFee || 0;
    updateUser(auth.id, u => { u.plan = null; u.onboarded = false; });
    return ok({ success: true, cancellationFee: fee, reason: body.reason });
  }

  if (m === 'POST' && p === '/api/consumer/ev-mode') {
    updateUser(auth.id, u => { u.evMode = body.enabled; });
    return ok({ success: true, evMode: body.enabled });
  }

  // ─── CONSUMER DASHBOARD ───
  if (m === 'GET' && p === '/api/consumer/dashboard') {
    const user = findUser(auth);
    const sd = STATE_DATA[user?.state] || DEFAULT_STATE;
    const city = user?.onboardingData?.city || 'default';
    const weather = WEATHER[city] || WEATHER['default'];
    const cap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
    const gf = weather.factor;

    const weeklyData = days7((d) => {
      const gen = +(cap * 4 * gf * (0.85 + Math.random() * 0.3)).toFixed(1);
      return { day: d.toLocaleDateString('en', { weekday: 'short' }), usage: +(gen * (0.9 + Math.random() * 0.4)).toFixed(1), generation: gen };
    });
    const generationForecast = forecast7((d, i) => {
      const f = 0.75 + Math.random() * 0.35;
      return { day: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }), generation: +(cap * 4 * f).toFixed(1), condition: f > 0.9 ? '☀️ Sunny' : f > 0.7 ? '⛅ Partly Cloudy' : '☁️ Cloudy' };
    });
    const todayGen = +(cap * 4 * gf * (0.9 + Math.random() * 0.2)).toFixed(1);
    const todayUsage = +(todayGen * (0.95 + Math.random() * 0.3)).toFixed(1);
    const oldBill = Math.floor(cap * 160 + 200);
    const curBill = plans.find(pl => pl.id === user?.plan)?.price || 999;
    const discSteps = ['Application Submitted', 'Technical Feasibility', 'Net Meter Issued', 'Inspection Cleared', 'System Active'];

    return ok({
      todayUsage, todayGeneration: todayGen,
      gridDependency: Math.max(0, Math.floor(100 - (todayGen / todayUsage) * 80)),
      monthlySavings: Math.max(0, oldBill - curBill + Math.floor(Math.random() * 200)),
      oldDiscombill: oldBill, co2Saved: +(todayGen * 0.82).toFixed(1), co2Monthly: +(todayGen * 30 * 0.82).toFixed(0),
      backupStatus: user?.plan === 'hybrid' ? 'ON' : 'N/A',
      daysRemaining: Math.floor(8 + Math.random() * 15), amountDue: curBill,
      weeklyData, generationForecast, weather,
      evMode: user?.evMode || false, evSaved: user?.evMode ? +(todayGen * 0.3 * 7.5).toFixed(0) : 0,
      discSteps, discStep: user?.plan === 'virtual' ? 2 : 1,
      stateData: sd, planCapacity: cap,
    });
  }

  // ─── CONSUMER BILLING ───
  if (m === 'GET' && p === '/api/consumer/billing') {
    const user = findUser(auth);
    const sd = STATE_DATA[user?.state] || DEFAULT_STATE;
    const pp = plans.find(pl => pl.id === user?.plan)?.price || 999;
    const cap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
    const gen = cap * 4 * 30 * 0.9;
    const selfC = Math.floor(gen * 0.65), exp = Math.floor(gen * 0.35);
    const expCredit = Math.floor(exp * sd.fit), gridCost = Math.floor(Math.random() * 200 + 100);
    const total = Math.max(0, pp - expCredit + gridCost);
    const oldEst = Math.floor(cap * 160 + 200);
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return ok({
      billing: { voltgridFee: pp, exportCredit: -expCredit, gridImport: gridCost, gst: Math.floor(total * 0.18), total: total + Math.floor(total * 0.18), oldBillEstimate: oldEst, savedVsOldBill: Math.max(0, oldEst - (total + Math.floor(total * 0.18))), due: '2026-03-25', status: 'Pending', units: Math.floor(selfC), unitsExported: Math.floor(exp), stateFit: sd.fit, discom: sd.discom },
      history: months.map((mo, i) => ({ month: mo, voltgridFee: pp, exportCredit: -(Math.floor(exp * sd.fit * (0.85 + Math.random() * 0.3))), total: Math.floor((pp - expCredit + gridCost) * (0.9 + Math.random() * 0.2)), status: i < 5 ? 'Paid' : 'Pending' })),
    });
  }

  // ─── CONSUMER CARBON ───
  if (m === 'GET' && p === '/api/consumer/carbon') {
    const user = findUser(auth);
    const cap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
    const monthlyGen = cap * 4 * 30 * 0.85;
    const totalCo2 = +(monthlyGen * 6 * 0.82).toFixed(1);
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return ok({ totalSaved: totalCo2, treesEquivalent: Math.floor(totalCo2 / 22), carsEquivalent: Math.floor(totalCo2 / 120), kmNotDriven: Math.floor(totalCo2 * 4), petrolLitresSaved: Math.floor(totalCo2 / 2.3), certificateId: 'VG-CO2-' + Math.random().toString(36).substr(2, 8).toUpperCase(), monthlyTrend: months.map(mo => ({ month: mo, co2: +(monthlyGen * 0.82 * (0.85 + Math.random() * 0.3)).toFixed(1) })), rank: 'Gold Saver', co2Goal: +(totalCo2 * 1.5).toFixed(1) });
  }

  // ─── APPOINTMENTS ───
  if (m === 'GET' && p === '/api/appointments') return ok(db.appts.filter(a => a.userId === auth?.id));

  if (m === 'POST' && p === '/api/appointments') {
    const { date, slot, type, notes } = body;
    const user = findUser(auth);
    const city = user?.onboardingData?.city || 'default';
    const centerMap = { 'Mumbai': 'Andheri Service Hub', 'Delhi': 'South Delhi Hub', 'Bangalore': 'Koramangala Hub', 'default': 'Nearest Service Hub' };
    const engMap = { 'Mumbai': 'Ramesh K.', 'Delhi': 'Suresh P.', 'Bangalore': 'Aditya N.', 'default': 'Service Team' };
    const consumerSteps = [
      { label: 'Application Submitted', detail: 'Your request is in queue', eta: 'Today' },
      { label: 'Site Survey', detail: 'Engineer visits your home', eta: '3–5 days' },
      { label: 'DISCOM Application', detail: 'VoltGrid files net metering', eta: '1–2 weeks' },
      { label: 'Technical Feasibility', detail: 'DISCOM reviews capacity', eta: '2–4 weeks' },
      { label: 'Net Meter Issued', detail: 'DISCOM installs meter', eta: '4–6 weeks' },
      { label: 'Panel Installation', detail: 'VoltGrid installs panels', eta: '6–7 weeks' },
      { label: 'Inspection & Clearance', detail: 'Final safety check', eta: '7–8 weeks' },
      { label: 'System Live! 🎉', detail: 'System generating', eta: '8–10 weeks' },
    ];
    const prosumerSteps = [
      { label: 'Asset Registered', detail: 'Logged in VoltGrid', eta: 'Today' },
      { label: 'Site Inspection', detail: 'Specs verified', eta: '3–5 days' },
      { label: 'Grid Connection Review', detail: 'DISCOM reviews', eta: '2–4 weeks' },
      { label: 'Net Meter Activation', detail: 'Meter activated', eta: '4–6 weeks' },
      { label: 'Live on Network', detail: 'Earnings begin', eta: '6–8 weeks' },
    ];
    const steps = type === 'prosumer' ? prosumerSteps : consumerSteps;
    const engineer = engMap[city] || engMap['default'];
    const appt = { id: gid(), userId: auth.id, date, slot, serviceCenter: centerMap[city] || centerMap['default'], engineer, type: type || 'consumer', step: 0, steps, notes: notes || '', estCompletionWeeks: 10, bookedAt: new Date().toISOString() };
    const appts = db.appts; appts.push(appt); db.appts = appts;
    pushNotif(auth.id, 'appointment', `📅 Appointment confirmed: ${date} (${slot}) with ${engineer}`);
    return ok(appt);
  }

  if (m === 'POST' && (match = p.match(/^\/api\/appointments\/(.+)\/advance$/))) {
    const appts = db.appts; const appt = appts.find(a => a.id === match[1] && a.userId === auth?.id);
    if (!appt) return err(404, 'Not found');
    if (appt.step < appt.steps.length - 1) {
      appt.step++;
      if (appt.step === appt.steps.length - 1) { updateUser(auth.id, u => { u.systemLive = true; }); pushNotif(auth.id, 'device', '🎉 Your solar system is now LIVE!'); }
    }
    db.appts = appts; return ok(appt);
  }

  if (m === 'POST' && (match = p.match(/^\/api\/appointments\/(.+)\/reschedule$/))) {
    const appts = db.appts; const appt = appts.find(a => a.id === match[1] && a.userId === auth?.id);
    if (!appt) return err(404, 'Not found');
    appt.date = body.date; appt.slot = body.slot;
    db.appts = appts; return ok(appt);
  }

  if (m === 'DELETE' && (match = p.match(/^\/api\/appointments\/(.+)$/))) {
    const appts = db.appts; const idx = appts.findIndex(a => a.id === match[1] && a.userId === auth?.id);
    if (idx === -1) return err(404, 'Not found');
    appts.splice(idx, 1); db.appts = appts; return ok({ success: true });
  }

  // ─── PROSUMER ───
  if (m === 'GET' && (match = p.match(/^\/api\/prosumer\/tariff\/(.+)$/))) {
    const state = decodeURIComponent(match[1]);
    const data = STATE_DATA[state] || DEFAULT_STATE;
    const premiumFit = +(data.fit + 0.50).toFixed(2);
    return ok({ state, stateFit: data.fit, voltgridFit: premiumFit, discom: data.discom, appc: data.appc, vnmAvailable: data.vnm, approvalWeeks: '4–8 weeks' });
  }

  if (m === 'POST' && p === '/api/prosumer/onboard') {
    updateUser(auth.id, u => { u.onboarded = true; u.prosumerData = body; u.state = body.state; u.systemLive = false; });
    pushNotif(auth.id, 'appointment', '📋 Asset registered. Book your site inspection to begin DISCOM application.');
    const fit = (STATE_DATA[body.state] || DEFAULT_STATE).fit;
    pushNotif(auth.id, 'billing', `🔎 Your state (${body.state}) feed-in tariff: ₹${fit}/kWh. VoltGrid premium: +₹0.50/kWh.`);
    return ok({ success: true });
  }

  if (m === 'GET' && p === '/api/prosumer/dashboard') {
    const user = findUser(auth);
    const sd = STATE_DATA[user?.state] || DEFAULT_STATE;
    const fit = sd.fit + 0.50;
    const city = user?.prosumerData?.location || 'default';
    const weather = WEATHER[city] || WEATHER['default'];
    const cap = parseFloat(user?.prosumerData?.area || 400) * 0.01 * weather.factor;
    const weeklyGeneration = days7(d => ({ day: d.toLocaleDateString('en', { weekday: 'short' }), generation: +(cap * 4.5 * (0.7 + Math.random() * 0.5)).toFixed(1) }));
    const generationForecast = forecast7((d, i) => { const f = 0.65 + Math.random() * 0.45; return { day: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }), generation: +(cap * 4.5 * f).toFixed(1), condition: f > 0.85 ? '☀️ Sunny' : f > 0.65 ? '⛅ Cloudy' : '🌧️ Rainy' }; });
    const todayGen = +(cap * 4.5 * weather.factor * (0.85 + Math.random() * 0.2)).toFixed(1);
    const monthlyGen = +(todayGen * 30).toFixed(0);
    const pipelineSteps = ['Asset Registered', 'Site Inspected', 'DISCOM Application Filed', 'Net Meter Installed', 'System Live'];
    const userAppts = db.appts.filter(a => a.userId === auth?.id);
    const pipelineStep = user?.systemLive ? 4 : Math.min(userAppts.length, 3);
    return ok({
      isLive: user?.systemLive || false, pipelineSteps, pipelineStep,
      todayGeneration: user?.systemLive ? todayGen : 0, todayEarnings: user?.systemLive ? Math.floor(todayGen * fit * 0.68) : 0,
      monthlyGeneration: user?.systemLive ? +monthlyGen : 0, monthlyEarnings: user?.systemLive ? Math.floor(monthlyGen * fit * 0.68) : 0,
      exported: 68, selfConsumed: 32, plantHealth: user?.systemLive ? Math.floor(85 + Math.random() * 12) : null,
      weeklyGeneration, generationForecast, weather, fit, stateFit: sd.fit,
      premiumLabel: `₹${sd.fit}/kWh state + ₹0.50 VoltGrid premium`, stateData: sd,
    });
  }

  if (m === 'GET' && p === '/api/prosumer/devices') {
    const user = findUser(auth);
    if (!user?.systemLive) return ok({ live: false, devices: [], message: 'Devices will appear after activation.' });
    return ok({ live: true, devices: [
      { id: 1, name: 'Solar Inverter', model: 'SMA Sunny Boy 8.0', status: 'Online', health: 96, lastSeen: new Date(Date.now() - 30000).toISOString(), firmware: 'v4.2.1' },
      { id: 2, name: 'Panel Array', model: 'Longi 420W × 20', status: 'Online', health: 99, lastSeen: new Date(Date.now() - 15000).toISOString(), firmware: 'N/A' },
      { id: 3, name: 'Battery Storage', model: 'BYD HVM 11.0', status: 'Warning', health: 72, lastSeen: new Date(Date.now() - 120000).toISOString(), firmware: 'v2.1.0' },
      { id: 4, name: 'Net Meter', model: 'Genus 5th Gen', status: 'Online', health: 100, lastSeen: new Date(Date.now() - 5000).toISOString(), firmware: 'v3.0.0' },
    ] });
  }

  if (m === 'GET' && p === '/api/prosumer/earnings') {
    const user = findUser(auth);
    const sd = STATE_DATA[user?.state] || DEFAULT_STATE;
    const fit = sd.fit + 0.50;
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return ok({ feedInTariff: fit, stateFit: sd.fit, voltgridPremium: 0.50, premiumNote: `VoltGrid pays ₹0.50/kWh above ${user?.state || 'state'} APPC`, projectedNext: user?.systemLive ? Math.floor(Math.random() * 1500 + 2800) : 0, pendingPayout: user?.systemLive ? Math.floor(Math.random() * 800 + 500) : 0, totalEarned: user?.systemLive ? Math.floor(Math.random() * 8000 + 12000) : 0, isLive: user?.systemLive || false, history: months.map((mo, i) => ({ id: i + 1, month: mo, date: `2025-${String(10 + i).padStart(2, '0')}-07`, units: Math.floor(300 + Math.random() * 200), amount: Math.floor(fit * (300 + Math.random() * 200) * 0.68), status: i < 3 ? 'Paid' : 'Pending', stateFit: sd.fit, voltgridFit: fit })) });
  }

  // ─── REFERRAL ───
  if (m === 'POST' && p === '/api/referral/apply') {
    const users = db.users;
    const referrer = users.find(u => u.referralCode === body.code);
    const self = users.find(u => u.id === auth?.id);
    if (!referrer) return err(400, 'Invalid referral code');
    if (referrer.id === self?.id) return err(400, 'Cannot use your own code');
    if (self?.referredBy) return err(400, 'Already applied a referral code');
    self.referredBy = body.code; self.freeMonths = 1;
    referrer.referralCount++; referrer.freeMonths = Math.min(referrer.freeMonths + 1, 6);
    db.users = users;
    pushNotif(referrer.id, 'billing', `🎁 ${self.name} joined with your referral! +1 free month.`);
    return ok({ success: true, freeMonths: 1, message: 'Referral applied — 1 month free!' });
  }

  if (m === 'GET' && p === '/api/referral/stats') {
    const user = findUser(auth);
    return ok({ referralCode: user?.referralCode, referralCount: user?.referralCount || 0, freeMonths: user?.freeMonths || 0, maxFreeMonths: 6 });
  }

  // ─── NOTIFICATIONS ───
  if (m === 'GET' && p === '/api/notifications') {
    const n = db.notifs;
    if (!n[auth?.id]) {
      n[auth?.id] = [
        { id: gid(), type: 'outage', message: '⚡ Grid restored after 4-min outage. Battery handled it.', read: false, time: new Date(Date.now() - 3600000).toISOString() },
        { id: gid(), type: 'billing', message: '📄 Your March bill is ready.', read: false, time: new Date(Date.now() - 7200000).toISOString() },
        { id: gid(), type: 'device', message: '🔋 Battery health at 72% — schedule maintenance.', read: false, time: new Date(Date.now() - 86400000).toISOString() },
      ];
      db.notifs = n;
    }
    return ok(n[auth?.id]);
  }

  if (m === 'POST' && p === '/api/notifications/mark-read') {
    const n = db.notifs;
    if (n[auth?.id]) n[auth?.id].forEach(x => x.read = true);
    db.notifs = n;
    return ok({ success: true });
  }

  // ─── SUPPORT ───
  if (m === 'GET' && p === '/api/support/tickets') return ok(db.tickets.filter(t => t.userId === auth?.id));

  if (m === 'POST' && p === '/api/support/tickets') {
    const { subject, description, category, priority } = body;
    const ticket = { id: gid(), userId: auth.id, subject, description, category: category || 'General', priority: priority || 'Normal', status: 'In Progress', slaHours: priority === 'High' ? 4 : 24, createdAt: new Date().toISOString() };
    const tickets = db.tickets; tickets.push(ticket); db.tickets = tickets;
    pushNotif(auth.id, 'device', `🎫 Ticket #${ticket.id.substr(0, 5)} opened.`);
    return ok(ticket);
  }

  if (m === 'POST' && (match = p.match(/^\/api\/support\/tickets\/(.+)\/close$/))) {
    const tickets = db.tickets; const t = tickets.find(x => x.id === match[1] && x.userId === auth?.id);
    if (!t) return err(404, 'Not found');
    t.status = 'Resolved'; db.tickets = tickets; return ok(t);
  }

  // ─── IOT LIVE ───
  if (m === 'GET' && p === '/api/iot/live') {
    const user = findUser(auth);
    const cap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
    const power = +(cap * (0.3 + Math.random() * 0.6)).toFixed(2);
    return ok({ voltage: +(218 + Math.random() * 8).toFixed(1), current: +(power / 0.23).toFixed(2), frequency: +(49.8 + Math.random() * 0.4).toFixed(2), powerFactor: +(0.92 + Math.random() * 0.06).toFixed(3), power, temperature: +(42 + Math.random() * 8).toFixed(1), batteryLevel: user?.plan === 'hybrid' ? Math.floor(60 + Math.random() * 35) : null, gridStatus: 'connected', dailyYield: +(power * 6.5 * (0.7 + Math.random() * 0.3)).toFixed(1) });
  }

  // ─── FORECAST ───
  if (m === 'GET' && (match = p.match(/^\/api\/forecast\/(.+)$/))) {
    const w = WEATHER[decodeURIComponent(match[1])] || WEATHER['default'];
    const forecast = forecast7((d, i) => { const f = 0.65 + Math.random() * 0.45; return { date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), condition: f > 0.85 ? '☀️ Sunny' : f > 0.65 ? '⛅ Partly Cloudy' : '☁️ Overcast', irradiance: +(w.irradiance * f).toFixed(1), tempHigh: Math.floor(28 + Math.random() * 10) }; });
    return ok({ current: w, forecast });
  }

  return err(404, 'Route not found: ' + p);
}

/* ═══════════════════════════════════════════════
   Activation — replaces axios adapter
═══════════════════════════════════════════════ */
export function activateMockBackend() {
  console.log('%c⚡ VoltGrid Mock Backend Active (no server needed)', 'color:#00d4aa;font-weight:bold');

  axios.defaults.adapter = (config) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = handle(config);
          const response = { data: result.data, status: result.status, statusText: result.status < 400 ? 'OK' : 'Error', headers: {}, config, request: {} };
          if (result.status >= 400) {
            const error = new Error(`Request failed with status code ${result.status}`);
            error.response = response; error.config = config; error.isAxiosError = true;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (e) {
          console.error('MockBackend error:', e);
          reject(e);
        }
      }, 50 + Math.random() * 100);
    });
  };
}
