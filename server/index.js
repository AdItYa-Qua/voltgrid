const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'voltgrid_secret_2024';

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.ALLOWED_ORIGIN,          // e.g. https://adityaqua.github.io
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean);
    // Allow same-origin / no-origin (Postman, curl) or whitelisted origins
    if (!origin || allowed.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json());

// ─── In-memory Database ───────────────────────────────────────────
let users = [];
let nextUserId = 1;
let appointments = [];
let tickets = [];
let notifications = {};
let referrals = {};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// ─── State-wise Solar Data ────────────────────────────────────────
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

const WEATHER_CONDITIONS = {
  'Mumbai':    { condition: 'Partly Cloudy', irradiance: 4.8, factor: 0.85, icon: '🌤️' },
  'Delhi':     { condition: 'Sunny',         irradiance: 5.5, factor: 1.0,  icon: '☀️' },
  'Bangalore': { condition: 'Sunny',         irradiance: 5.2, factor: 0.95, icon: '☀️' },
  'Chennai':   { condition: 'Hazy Sunny',    irradiance: 5.0, factor: 0.92, icon: '🌞' },
  'Hyderabad': { condition: 'Sunny',         irradiance: 5.4, factor: 0.98, icon: '☀️' },
  'Pune':      { condition: 'Sunny',         irradiance: 5.1, factor: 0.93, icon: '☀️' },
  'Jaipur':    { condition: 'Sunny',         irradiance: 5.8, factor: 1.0,  icon: '☀️' },
  'Kolkata':   { condition: 'Cloudy',        irradiance: 4.2, factor: 0.75, icon: '⛅' },
  'Lucknow':   { condition: 'Sunny',         irradiance: 5.3, factor: 0.96, icon: '☀️' },
  'Ahmedabad': { condition: 'Sunny',         irradiance: 5.7, factor: 1.0,  icon: '☀️' },
  'default':   { condition: 'Partly Cloudy', irradiance: 5.0, factor: 0.90, icon: '🌤️' },
};

// ─── Auth Middleware ──────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 10);
  const referralCode = 'VG' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const user = {
    id: nextUserId++, email, password: hash,
    name: name || email.split('@')[0],
    phone: phone || '',
    role: null, plan: null, onboarded: false,
    onboardingData: null, prosumerData: null,
    state: null, homeType: null,
    referralCode, referredBy: null,
    referralCount: 0, freeMonths: 0,
    evMode: false, systemLive: false,
    discountApplied: 0,
  };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, onboarded: user.onboarded } });
});

app.post('/api/auth/role', authMiddleware, (req, res) => {
  const { role } = req.body;
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.role = role;
  res.json({ success: true, role });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan, onboarded: user.onboarded, phone: user.phone, state: user.state, homeType: user.homeType, referralCode: user.referralCode, freeMonths: user.freeMonths, evMode: user.evMode, systemLive: user.systemLive });
});

// ─── State & PM Surya Ghar APIs ─────────────────────────────────────
app.get('/api/state/:state', (req, res) => {
  const data = STATE_DATA[req.params.state] || DEFAULT_STATE;
  res.json(data);
});

app.get('/api/states', (req, res) => {
  res.json(Object.keys(STATE_DATA));
});

app.post('/api/subsidy/calculate', (req, res) => {
  const { capacityKw, homeType } = req.body;
  const kw = parseFloat(capacityKw) || 3;
  let subsidy = 0;
  let eligible = homeType !== 'commercial';
  if (eligible) {
    if (kw <= 2) subsidy = 30000 * kw;
    else if (kw <= 3) subsidy = 60000 + 18000 * (kw - 2);
    else subsidy = 78000; // max cap
  }
  res.json({ eligible, subsidy, maxSubsidy: 78000, scheme: 'PM Surya Ghar: Muft Bijli Yojana', loanAvailable: eligible, loanRate: 7, processingTime: '4–8 weeks' });
});

// ─── Consumer Plans ────────────────────────────────────────────────
const plans = [
  {
    id: 'virtual', name: 'Virtual Solar', price: 999, capacity: '3 kW', badge: 'VNM Required',
    description: 'Solar energy allocated from partner network farms. No rooftop needed.',
    vnmRequired: true,
    savings: { min: 400, max: 700 },
    contractMonths: 12, cancellationFee: 0,
    sla: '99% uptime', responseTime: '48 hours',
    features: ['3 kW virtual allocation', 'Monthly bill credit', 'App-based monitoring', 'Green certificate', 'Email support'],
    color: 'teal',
  },
  {
    id: 'rooftop', name: 'Rooftop Solar', price: 1999, capacity: '5 kW', badge: 'Most Popular',
    description: 'On-site rooftop installation — zero upfront investment, managed by VoltGrid.',
    vnmRequired: false,
    savings: { min: 1000, max: 1800 },
    contractMonths: 24, cancellationFee: 2999,
    sla: '99.5% uptime', responseTime: '24 hours',
    features: ['5 kW on-site system', 'Real-time IoT monitoring', '25-year panel warranty', 'Net metering handled', 'Priority support', 'Annual O&M included'],
    color: 'green',
  },
  {
    id: 'hybrid', name: 'Hybrid Pro', price: 2999, capacity: '8 kW + Battery', badge: 'Power Secure',
    description: '8kW solar + 10kWh battery storage. Outage-proof, EV-ready.',
    vnmRequired: false,
    savings: { min: 1800, max: 2800 },
    contractMonths: 36, cancellationFee: 4999,
    sla: '99.9% + Battery backup', responseTime: '4 hours',
    features: ['8 kW solar + 10 kWh battery', '6-hour backup guarantee', 'EV charging ready', 'Outage auto-switch', 'Dedicated account manager', 'Priority onsite response', 'API access'],
    color: 'purple',
  },
  {
    id: 'society', name: 'Society / RWA Plan', price: 8999, capacity: '30 kW', badge: 'Group Plan',
    description: 'Group solar for housing societies, RWAs, and apartment complexes. One subscription, all residents benefit.',
    vnmRequired: false,
    savings: { min: 5000, max: 12000 },
    contractMonths: 36, cancellationFee: 9999,
    sla: '99.9% uptime', responseTime: '4 hours',
    features: ['30 kW shared installation', 'Common area coverage', 'Per-unit sub-metering', 'Resident portal access', 'Society billing dashboard', 'Annual energy audit', 'DISCOM liaison handled'],
    color: 'orange',
    isGroup: true,
  },
];

app.get('/api/consumer/plans', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const stateData = STATE_DATA[user?.state] || DEFAULT_STATE;
  res.json({ plans, activePlan: user?.plan || null, stateData, userState: user?.state });
});

app.post('/api/consumer/subscribe', authMiddleware, (req, res) => {
  const { planId } = req.body;
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.plan = planId;
  user.onboarded = true;
  if (!notifications[user.id]) notifications[user.id] = [];
  const planName = plans.find(p => p.id === planId)?.name;
  notifications[user.id].unshift({ id: generateId(), type: 'billing', message: `🎉 Subscribed to ${planName}! Your installation survey is being scheduled.`, read: false, time: new Date().toISOString() });
  notifications[user.id].unshift({ id: generateId(), type: 'appointment', message: `📅 Site survey scheduled. Your service engineer will contact you within 48 hours.`, read: false, time: new Date().toISOString() });
  res.json({ success: true, plan: planId });
});

app.post('/api/consumer/onboard', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (user) {
    user.onboarded = true;
    user.onboardingData = req.body;
    user.state = req.body.state;
    user.homeType = req.body.homeType;
  }
  res.json({ success: true });
});

app.post('/api/consumer/cancel', authMiddleware, (req, res) => {
  const { reason } = req.body;
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const plan = plans.find(p => p.id === user.plan);
  const fee = plan?.cancellationFee || 0;
  user.plan = null; user.onboarded = false;
  res.json({ success: true, cancellationFee: fee, reason });
});

app.post('/api/consumer/ev-mode', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.evMode = req.body.enabled;
  res.json({ success: true, evMode: user.evMode });
});

app.get('/api/consumer/dashboard', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const stateData = STATE_DATA[user?.state] || DEFAULT_STATE;
  const city = user?.onboardingData?.city || 'default';
  const weather = WEATHER_CONDITIONS[city] || WEATHER_CONDITIONS['default'];
  const now = new Date();
  const isEvMode = user?.evMode || false;

  // Plan-based metrics
  const planCapacity = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
  const genFactor = weather.factor;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const gen = +(planCapacity * 4 * genFactor * (0.85 + Math.random() * 0.3)).toFixed(1);
    const usage = +(gen * (0.9 + Math.random() * 0.4)).toFixed(1);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), usage, generation: gen };
  });

  // 7-day gen forecast
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const fFactor = 0.75 + Math.random() * 0.35;
    return {
      day: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }),
      generation: +(planCapacity * 4 * fFactor).toFixed(1),
      condition: fFactor > 0.9 ? '☀️ Sunny' : fFactor > 0.7 ? '⛅ Partly Cloudy' : '☁️ Cloudy',
    };
  });

  const todayGen = +(planCapacity * 4 * genFactor * (0.9 + Math.random() * 0.2)).toFixed(1);
  const todayUsage = +(todayGen * (0.95 + Math.random() * 0.3)).toFixed(1);
  const oldDiscombill = Math.floor(planCapacity * 160 + 200);
  const currentBill = Math.floor(plans.find(p => p.id === user?.plan)?.price || 999);
  const monthlySavings = Math.max(0, oldDiscombill - currentBill + Math.floor(Math.random() * 200));

  // DISCOM connection steps
  const discSteps = ['Application Submitted', 'Technical Feasibility', 'Net Meter Issued', 'Inspection Cleared', 'System Active'];
  const discStep = user?.plan === 'virtual' ? 2 : 1;

  res.json({
    todayUsage,
    todayGeneration: todayGen,
    gridDependency: Math.max(0, Math.floor(100 - (todayGen / todayUsage) * 80)),
    monthlySavings,
    oldDiscombill,
    co2Saved: +(todayGen * 0.82).toFixed(1),
    co2Monthly: +(todayGen * 30 * 0.82).toFixed(0),
    backupStatus: user?.plan === 'hybrid' ? 'ON' : 'N/A',
    daysRemaining: Math.floor(8 + Math.random() * 15),
    amountDue: currentBill,
    weeklyData: days,
    generationForecast: forecast,
    weather,
    evMode: isEvMode,
    evSaved: isEvMode ? +(todayGen * 0.3 * 7.5).toFixed(0) : 0, // EV kms on solar
    discSteps, discStep,
    stateData,
    planCapacity,
  });
});

// ─── Consumer Billing ─────────────────────────────────────────────
app.get('/api/consumer/billing', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const stateData = STATE_DATA[user?.state] || DEFAULT_STATE;
  const planPrice = plans.find(p => p.id === user?.plan)?.price || 999;
  const planCapacity = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
  const generation = planCapacity * 4 * 30 * 0.9;
  const selfConsumed = Math.floor(generation * 0.65);
  const exported = Math.floor(generation * 0.35);
  const exportCredit = Math.floor(exported * stateData.fit);
  const gridImportCost = Math.floor(Math.random() * 200 + 100);
  const total = Math.max(0, planPrice - exportCredit + gridImportCost);
  const oldBillEst = Math.floor(planCapacity * 160 + 200);

  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  res.json({
    billing: {
      voltgridFee: planPrice,
      exportCredit: -exportCredit,
      gridImport: gridImportCost,
      gst: Math.floor(total * 0.18),
      total: total + Math.floor(total * 0.18),
      oldBillEstimate: oldBillEst,
      savedVsOldBill: Math.max(0, oldBillEst - (total + Math.floor(total * 0.18))),
      due: '2026-03-25',
      status: 'Pending',
      units: Math.floor(selfConsumed),
      unitsExported: Math.floor(exported),
      stateFit: stateData.fit,
      discom: stateData.discom,
    },
    history: months.map((m, i) => ({
      month: m,
      voltgridFee: planPrice,
      exportCredit: -(Math.floor(exported * stateData.fit * (0.85 + Math.random() * 0.3))),
      total: Math.floor((planPrice - exportCredit + gridImportCost) * (0.9 + Math.random() * 0.2)),
      status: i < 5 ? 'Paid' : 'Pending',
    })),
  });
});

// ─── Consumer Carbon ──────────────────────────────────────────────
app.get('/api/consumer/carbon', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const planCap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
  const monthsActive = 6;
  const monthlyGen = planCap * 4 * 30 * 0.85;
  const totalGen = monthlyGen * monthsActive;
  const totalCo2 = +(totalGen * 0.82).toFixed(1);
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  res.json({
    totalSaved: totalCo2,
    treesEquivalent: Math.floor(totalCo2 / 22),
    carsEquivalent: Math.floor(totalCo2 / 120),
    kmNotDriven: Math.floor(totalCo2 * 4),
    petrolLitresSaved: Math.floor(totalCo2 / 2.3),
    certificateId: 'VG-CO2-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    monthlyTrend: months.map(m => ({ month: m, co2: +(monthlyGen * 0.82 * (0.85 + Math.random() * 0.3)).toFixed(1) })),
    rank: 'Gold Saver', // tier system
    co2Goal: +(totalCo2 * 1.5).toFixed(1),
  });
});

// ─── Appointments ─────────────────────────────────────────────────
app.get('/api/appointments', authMiddleware, (req, res) => {
  const userAppts = appointments.filter(a => a.userId === req.user.id);
  res.json(userAppts);
});

app.post('/api/appointments', authMiddleware, (req, res) => {
  const { date, slot, type, notes } = req.body;
  const user = users.find(u => u.id === req.user.id);
  const cityMap = { 'Mumbai': 'Andheri Service Hub', 'Delhi': 'South Delhi Hub', 'Bangalore': 'Koramangala Hub', 'Chennai': 'Anna Nagar Hub', 'Hyderabad': 'Banjara Hills Hub', 'Pune': 'Kothrud Service Hub', 'Jaipur': 'C-Scheme Hub', 'Kolkata': 'Salt Lake Hub', 'default': 'Nearest Service Hub' };
  const city = user?.onboardingData?.city || 'default';
  const center = cityMap[city] || cityMap['default'];
  // Engineer assigned based on city
  const engineers = { 'Mumbai': 'Ramesh K.', 'Delhi': 'Suresh P.', 'Bangalore': 'Aditya N.', 'Chennai': 'Karthik S.', 'Hyderabad': 'Vinod R.', 'default': 'Service Team' };
  const engineer = engineers[city] || engineers['default'];

  const consumerSteps = [
    { label: 'Application Submitted', detail: 'Your request is in queue', eta: 'Today' },
    { label: 'Site Survey', detail: 'Engineer visits your home for technical assessment', eta: '3–5 days' },
    { label: 'DISCOM Application', detail: 'VoltGrid files net metering application on your behalf', eta: '1–2 weeks' },
    { label: 'Technical Feasibility', detail: 'DISCOM reviews your connection capacity', eta: '2–4 weeks' },
    { label: 'Net Meter Issued', detail: 'DISCOM installs bidirectional meter', eta: '4–6 weeks' },
    { label: 'Panel Installation', detail: 'VoltGrid engineers install solar array', eta: '6–7 weeks' },
    { label: 'Inspection & Clearance', detail: 'Final safety inspection and DISCOM sign-off', eta: '7–8 weeks' },
    { label: 'System Live! 🎉', detail: 'Your solar system is generating and earning', eta: '8–10 weeks' },
  ];
  const prosumerSteps = [
    { label: 'Asset Registered', detail: 'Your solar asset is logged in VoltGrid network', eta: 'Today' },
    { label: 'Site Inspection', detail: 'Technical team verifies your system specs', eta: '3–5 days' },
    { label: 'Grid Connection Review', detail: 'DISCOM reviews your export capacity', eta: '2–4 weeks' },
    { label: 'Net Meter Activation', detail: 'Bidirectional meter activated for export', eta: '4–6 weeks' },
    { label: 'Live on Network', detail: 'Earnings begin from generation today', eta: '6–8 weeks' },
  ];
  const rwaSteps = [
    { label: 'Society Application', detail: 'RWA documents verified', eta: 'Today' },
    { label: 'Common Area Survey', detail: 'Load assessment for common areas + units', eta: '5–7 days' },
    { label: 'DISCOM Bulk Application', detail: 'Single bulk net metering application', eta: '3–5 weeks' },
    { label: 'Installation', detail: '30kW array installed on rooftop/common area', eta: '6–8 weeks' },
    { label: 'Sub-metering Setup', detail: 'Per-unit distribution meters configured', eta: '8–9 weeks' },
    { label: 'Society Live 🎉', detail: 'All units now on solar', eta: '10 weeks' },
  ];
  const stepMap = { prosumer: prosumerSteps, rwa: rwaSteps, consumer: consumerSteps };
  const steps = stepMap[type] || consumerSteps;

  const appt = { id: generateId(), userId: req.user.id, date, slot, serviceCenter: center, engineer, type: type || 'consumer', step: 0, steps, notes: notes || '', estCompletionWeeks: 10, bookedAt: new Date().toISOString() };
  appointments.push(appt);
  if (!notifications[req.user.id]) notifications[req.user.id] = [];
  notifications[req.user.id].unshift({ id: generateId(), type: 'appointment', message: `📅 Appointment confirmed: ${date} (${slot}) with ${engineer}`, read: false, time: new Date().toISOString() });
  res.json(appt);
});

app.post('/api/appointments/:id/advance', authMiddleware, (req, res) => {
  const appt = appointments.find(a => a.id === req.params.id && a.userId === req.user.id);
  if (!appt) return res.status(404).json({ error: 'Not found' });
  if (appt.step < appt.steps.length - 1) {
    appt.step++;
    if (appt.step === appt.steps.length - 1) {
      // system live
      const user = users.find(u => u.id === req.user.id);
      if (user) user.systemLive = true;
      if (!notifications[req.user.id]) notifications[req.user.id] = [];
      notifications[req.user.id].unshift({ id: generateId(), type: 'device', message: '🎉 Your solar system is now LIVE! Generation tracking has begun.', read: false, time: new Date().toISOString() });
    }
  }
  res.json(appt);
});

app.post('/api/appointments/:id/reschedule', authMiddleware, (req, res) => {
  const { date, slot } = req.body;
  const appt = appointments.find(a => a.id === req.params.id && a.userId === req.user.id);
  if (!appt) return res.status(404).json({ error: 'Not found' });
  appt.date = date;
  appt.slot = slot;
  res.json(appt);
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  const idx = appointments.findIndex(a => a.id === req.params.id && a.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  appointments.splice(idx, 1);
  res.json({ success: true });
});

// ─── Prosumer Routes ──────────────────────────────────────────────
app.get('/api/prosumer/tariff/:state', (req, res) => {
  const data = STATE_DATA[req.params.state] || DEFAULT_STATE;
  const fit = data.fit;
  const premiumFit = +(fit + 0.50).toFixed(2); // VoltGrid premium of ₹0.50/kWh above state APPC
  res.json({ state: req.params.state, stateFit: fit, voltgridFit: premiumFit, discom: data.discom, appc: data.appc, vnmAvailable: data.vnm, approvalWeeks: '4–8 weeks' });
});

app.post('/api/prosumer/onboard', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (user) {
    user.onboarded = true;
    user.prosumerData = req.body;
    user.state = req.body.state;
    user.systemLive = false; // Not live until DISCOM approval
  }
  // Seed notifications for prosumer journey
  if (!notifications[user.id]) notifications[user.id] = [];
  notifications[user.id].push({ id: generateId(), type: 'appointment', message: '📋 Asset registered. Book your site inspection to begin DISCOM application.', read: false, time: new Date().toISOString() });
  notifications[user.id].push({ id: generateId(), type: 'billing', message: `🔎 Your state (${req.body.state}) feed-in tariff: ₹${(STATE_DATA[req.body.state] || DEFAULT_STATE).fit}/kWh. VoltGrid premium: +₹0.50/kWh.`, read: false, time: new Date().toISOString() });
  res.json({ success: true });
});

app.get('/api/prosumer/dashboard', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const stateData = STATE_DATA[user?.state] || DEFAULT_STATE;
  const fit = stateData.fit + 0.50; // VoltGrid premium
  const city = user?.prosumerData?.location || 'default';
  const weather = WEATHER_CONDITIONS[city] || WEATHER_CONDITIONS['default'];
  const cap = parseFloat(user?.prosumerData?.area || 400) * 0.01 * weather.factor;

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const gen = +(cap * 4.5 * (0.7 + Math.random() * 0.5)).toFixed(1);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), generation: gen };
  });

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const f = 0.65 + Math.random() * 0.45;
    return { day: i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }), generation: +(cap * 4.5 * f).toFixed(1), condition: f > 0.85 ? '☀️ Sunny' : f > 0.65 ? '⛅ Cloudy' : '🌧️ Rainy' };
  });

  const todayGen = +(cap * 4.5 * weather.factor * (0.85 + Math.random() * 0.2)).toFixed(1);
  const monthlyGen = +(todayGen * 30).toFixed(0);
  const todayEarn = Math.floor(todayGen * fit * 0.68); // 68% exported
  const monthlyEarnings = Math.floor(monthlyGen * fit * 0.68);

  // DISCOM pipeline
  const pipelineSteps = ['Asset Registered', 'Site Inspected', 'DISCOM Application Filed', 'Net Meter Installed', 'System Live'];
  const appts = appointments.filter(a => a.userId === req.user.id);
  const pipelineStep = user?.systemLive ? 4 : Math.min(appts.length, 3);

  res.json({
    isLive: user?.systemLive || false,
    pipelineSteps, pipelineStep,
    todayGeneration: user?.systemLive ? todayGen : 0,
    todayEarnings: user?.systemLive ? todayEarn : 0,
    monthlyGeneration: user?.systemLive ? +(monthlyGen) : 0,
    monthlyEarnings: user?.systemLive ? monthlyEarnings : 0,
    exported: 68, selfConsumed: 32,
    plantHealth: user?.systemLive ? Math.floor(85 + Math.random() * 12) : null,
    weeklyGeneration: days,
    generationForecast: forecast,
    weather, fit,
    stateFit: stateData.fit,
    premiumLabel: `₹${stateData.fit}/kWh state + ₹0.50 VoltGrid premium`,
    stateData,
  });
});

app.get('/api/prosumer/devices', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user?.systemLive) {
    return res.json({ live: false, devices: [], message: 'Devices will appear after your net meter is activated.' });
  }
  res.json({
    live: true,
    devices: [
      { id: 1, name: 'Solar Inverter', model: 'SMA Sunny Boy 8.0', status: 'Online', health: 96, lastSeen: new Date(Date.now() - 30000).toISOString(), firmware: 'v4.2.1' },
      { id: 2, name: 'Panel Array', model: 'Longi 420W × 20', status: 'Online', health: 99, lastSeen: new Date(Date.now() - 15000).toISOString(), firmware: 'N/A' },
      { id: 3, name: 'Battery Storage', model: 'BYD HVM 11.0', status: 'Warning', health: 72, lastSeen: new Date(Date.now() - 120000).toISOString(), firmware: 'v2.1.0' },
      { id: 4, name: 'Net Meter', model: 'Genus 5th Gen', status: 'Online', health: 100, lastSeen: new Date(Date.now() - 5000).toISOString(), firmware: 'v3.0.0' },
    ],
  });
});

app.get('/api/prosumer/earnings', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const stateData = STATE_DATA[user?.state] || DEFAULT_STATE;
  const fit = stateData.fit + 0.50;
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  res.json({
    feedInTariff: fit,
    stateFit: stateData.fit,
    voltgridPremium: 0.50,
    premiumNote: `VoltGrid pays ₹0.50/kWh above ${user?.state || 'state'} APPC of ₹${stateData.fit}/kWh`,
    projectedNext: user?.systemLive ? Math.floor(Math.random() * 1500 + 2800) : 0,
    pendingPayout: user?.systemLive ? Math.floor(Math.random() * 800 + 500) : 0,
    totalEarned: user?.systemLive ? Math.floor(Math.random() * 8000 + 12000) : 0,
    isLive: user?.systemLive || false,
    history: months.map((m, i) => ({
      id: i + 1, month: m,
      date: `2025-${String(10 + i).padStart(2,'0')}-07`,
      units: Math.floor(300 + Math.random() * 200),
      amount: Math.floor(fit * (300 + Math.random() * 200) * 0.68),
      status: i < 3 ? 'Paid' : 'Pending',
      stateFit: stateData.fit, voltgridFit: fit,
    })),
  });
});

// ─── Referral System ──────────────────────────────────────────────
app.post('/api/referral/apply', authMiddleware, (req, res) => {
  const { code } = req.body;
  const referrer = users.find(u => u.referralCode === code);
  const self = users.find(u => u.id === req.user.id);
  if (!referrer) return res.status(400).json({ error: 'Invalid referral code' });
  if (referrer.id === self.id) return res.status(400).json({ error: 'Cannot use your own code' });
  if (self.referredBy) return res.status(400).json({ error: 'Already applied a referral code' });
  self.referredBy = code;
  self.freeMonths = 1;
  referrer.referralCount++;
  referrer.freeMonths = Math.min(referrer.freeMonths + 1, 6);
  if (!notifications[referrer.id]) notifications[referrer.id] = [];
  notifications[referrer.id].unshift({ id: generateId(), type: 'billing', message: `🎁 ${self.name} joined with your referral! You've earned +1 free month.`, read: false, time: new Date().toISOString() });
  res.json({ success: true, freeMonths: self.freeMonths, message: 'Referral applied — 1 month free added to your account!' });
});

app.get('/api/referral/stats', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  res.json({ referralCode: user?.referralCode, referralCount: user?.referralCount || 0, freeMonths: user?.freeMonths || 0, maxFreeMonths: 6 });
});

// ─── Notifications ────────────────────────────────────────────────
app.get('/api/notifications', authMiddleware, (req, res) => {
  if (!notifications[req.user.id]) {
    notifications[req.user.id] = [
      { id: generateId(), type: 'outage', message: '⚡ Grid restored in your area after 4-min outage. Battery handled it seamlessly.', read: false, time: new Date(Date.now() - 3600000).toISOString() },
      { id: generateId(), type: 'billing', message: '📄 Your March bill is ready — check Billing for breakdown and savings vs DISCOM.', read: false, time: new Date(Date.now() - 7200000).toISOString() },
      { id: generateId(), type: 'device', message: '🔋 Battery health at 72% — schedule a maintenance check to restore peak performance.', read: false, time: new Date(Date.now() - 86400000).toISOString() },
      { id: generateId(), type: 'billing', message: '🌞 Today\'s generation forecast: 28.4 kWh — potential savings of ₹204 vs grid.', read: true, time: new Date(Date.now() - 172800000).toISOString() },
    ];
  }
  res.json(notifications[req.user.id]);
});

app.post('/api/notifications/mark-read', authMiddleware, (req, res) => {
  if (notifications[req.user.id]) {
    notifications[req.user.id].forEach(n => n.read = true);
  }
  res.json({ success: true });
});

// ─── Support ──────────────────────────────────────────────────────
app.get('/api/support/tickets', authMiddleware, (req, res) => {
  res.json(tickets.filter(t => t.userId === req.user.id));
});

app.post('/api/support/tickets', authMiddleware, (req, res) => {
  const { subject, description, category, priority } = req.body;
  const ticket = {
    id: generateId(), userId: req.user.id, subject, description,
    category: category || 'General', priority: priority || 'Normal',
    status: 'In Progress', slaHours: priority === 'High' ? 4 : 24,
    createdAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  if (!notifications[req.user.id]) notifications[req.user.id] = [];
  notifications[req.user.id].unshift({ id: generateId(), type: 'device', message: `🎫 Ticket #${ticket.id.substr(0,5)} opened — we'll respond within ${ticket.slaHours}h.`, read: false, time: new Date().toISOString() });
  res.json(ticket);
});

app.post('/api/support/tickets/:id/close', authMiddleware, (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  ticket.status = 'Resolved';
  res.json(ticket);
});

// ─── IoT Live Data ────────────────────────────────────────────────
app.get('/api/iot/live', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const planCap = { virtual: 3, rooftop: 5, hybrid: 8, society: 30 }[user?.plan] || 3;
  const power = +(planCap * (0.3 + Math.random() * 0.6)).toFixed(2);
  res.json({
    voltage: +(218 + Math.random() * 8).toFixed(1),
    current: +(power / 0.23).toFixed(2),
    frequency: +(49.8 + Math.random() * 0.4).toFixed(2),
    powerFactor: +(0.92 + Math.random() * 0.06).toFixed(3),
    power,
    temperature: +(42 + Math.random() * 8).toFixed(1), // panel temp
    batteryLevel: user?.plan === 'hybrid' ? Math.floor(60 + Math.random() * 35) : null,
    gridStatus: 'connected',
    dailyYield: +(power * 6.5 * (0.7 + Math.random() * 0.3)).toFixed(1),
  });
});

// ─── Weather / Forecast ───────────────────────────────────────────
app.get('/api/forecast/:city', (req, res) => {
  const w = WEATHER_CONDITIONS[req.params.city] || WEATHER_CONDITIONS['default'];
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const f = 0.65 + Math.random() * 0.45;
    return {
      date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      condition: f > 0.85 ? '☀️ Sunny' : f > 0.65 ? '⛅ Partly Cloudy' : '☁️ Overcast',
      irradiance: +(w.irradiance * f).toFixed(1),
      tempHigh: Math.floor(28 + Math.random() * 10),
    };
  });
  res.json({ current: w, forecast });
});

app.listen(PORT, () => console.log(`VoltGrid API running on http://localhost:${PORT}`));
