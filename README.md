# ⚡ VoltGrid — Energy-as-a-Service Platform

> India's first peer-to-peer EaaS platform connecting solar prosumers, consumers, and RWAs on a single intelligent grid.

![VoltGrid Hero](client/public/hero-grid.png)

---

## 🚀 What is VoltGrid?

VoltGrid is a full-stack **Energy-as-a-Service (EaaS)** platform that lets:
- **Consumers** → subscribe to clean energy plans, monitor IoT devices, and track their carbon footprint
- **Prosumers** → sell surplus solar energy to the grid and earn real-time credits
- **RWAs / Societies** → manage bulk energy subscriptions and shared solar revenue

---

## 🏗 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Lucide Icons, Recharts |
| Styling | Vanilla CSS + Tailwind v4 |
| Backend | Node.js, Express |
| Auth | JWT (cookie-based) |
| Database | MongoDB (Mongoose) |
| IoT | WebSocket real-time sensor data |

---

## 📁 Project Structure

```
voltgrid/
├── client/          # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── pages/   # Landing, Login, Consumer, Prosumer pages
│       ├── components/
│       └── context/
└── server/          # Express REST API
    └── index.js
```

---

## 🔧 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or Atlas URI

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/voltgrid.git
cd voltgrid
```

### 2. Setup the server
```bash
cd server
npm install
# Create .env with:
# MONGO_URI=<your_mongo_uri>
# JWT_SECRET=<your_secret>
# PORT=5000
npm start
```

### 3. Setup the client
```bash
cd client
npm install
npm run dev
```

Open [https://aditya-qua.github.io/](https://aditya-qua.github.io/) to see the landing page.

---

## ✨ Key Features

- 🌟 **EaaS Landing Page** — scroll-reveal animations + parallax hero
- ⚡ **Real-time IoT Dashboard** — live power monitoring charts
- 💰 **Prosumer Earnings** — sell solar energy, withdraw via UPI
- 🌱 **Carbon Tracker** — automated CO₂ offset reports
- 📊 **Dynamic Billing** — DISCOM-compliant time-of-use pricing
- 📅 **Appointment Booking** — schedule technician visits
- 🏆 **Referral System** — earn ₹200 per referral

---

## 📄 License

MIT © 2026 VoltGrid
