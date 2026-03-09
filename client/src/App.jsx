import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';

// Landing
import LandingPage from './pages/LandingPage';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';

// Consumer
import ConsumerOnboarding from './pages/consumer/Onboarding';
import ConsumerDashboard from './pages/consumer/Dashboard';
import Plans from './pages/consumer/Plans';
import IoTMonitor from './pages/consumer/IoTMonitor';
import Carbon from './pages/consumer/Carbon';
import Billing from './pages/consumer/Billing';
import ConsumerAppointments from './pages/consumer/Appointments';

// Prosumer
import ProsumerOnboarding from './pages/prosumer/Onboarding';
import ProsumerDashboard from './pages/prosumer/Dashboard';
import ProsumerDevices from './pages/prosumer/Devices';
import Earnings from './pages/prosumer/Earnings';
import ProsumerAppointments from './pages/prosumer/Appointments';

// Shared
import Support from './pages/Support';
import Referral from './pages/Referral';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa', fontSize: '1.1rem' }}>Loading VoltGrid…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.role) return <Navigate to="/select-role" replace />;
  return children;
}

function RoleRoute({ consumerPage, prosumerPage }) {
  const { user } = useAuth();
  if (user?.role === 'prosumer') return prosumerPage;
  // RWA uses consumer pages (plans, dashboard, etc.)
  return consumerPage;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role selection */}
      <Route path="/select-role" element={
        <ProtectedRoute><RoleSelection /></ProtectedRoute>
      } />

      {/* Onboarding (after role picked) */}
      <Route path="/onboarding" element={
        <OnboardingGuard>
          {user?.role === 'prosumer' ? <ProsumerOnboarding /> : <ConsumerOnboarding />}
        </OnboardingGuard>
      } />

      {/* Protected app routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <>
            <Navbar />
            <main style={{ paddingTop: 0 }}>
              <RoleRoute
                consumerPage={<ConsumerDashboard />}
                prosumerPage={<ProsumerDashboard />}
              />
            </main>
          </>
        </ProtectedRoute>
      } />

      <Route path="/plans" element={
        <ProtectedRoute>
          <><Navbar /><Plans /></>
        </ProtectedRoute>
      } />

      <Route path="/iot" element={
        <ProtectedRoute>
          <><Navbar /><IoTMonitor /></>
        </ProtectedRoute>
      } />

      <Route path="/carbon" element={
        <ProtectedRoute>
          <><Navbar /><Carbon /></>
        </ProtectedRoute>
      } />

      <Route path="/billing" element={
        <ProtectedRoute>
          <><Navbar /><Billing /></>
        </ProtectedRoute>
      } />

      <Route path="/devices" element={
        <ProtectedRoute>
          <><Navbar /><ProsumerDevices /></>
        </ProtectedRoute>
      } />

      <Route path="/earnings" element={
        <ProtectedRoute>
          <><Navbar /><Earnings /></>
        </ProtectedRoute>
      } />

      <Route path="/appointments" element={
        <ProtectedRoute>
          <><Navbar />
            <RoleRoute
              consumerPage={<ConsumerAppointments />}
              prosumerPage={<ProsumerAppointments />}
            />
          </>
        </ProtectedRoute>
      } />

      <Route path="/support" element={
        <ProtectedRoute>
          <><Navbar /><Support /></>
        </ProtectedRoute>
      } />

      <Route path="/referral" element={
        <ProtectedRoute>
          <><Navbar /><Referral /></>
        </ProtectedRoute>
      } />

      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
