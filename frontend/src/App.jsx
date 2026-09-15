import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { BootSequence } from './components/layout/BootSequence';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ZoneDetailPage } from './pages/ZoneDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AboutPage } from './pages/AboutPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';

// Animated route wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/zone/:zoneId" element={<ZoneDetailPage />} />
        <Route path="/alerts"     element={<AlertsPage />} />
        <Route path="/analytics"  element={<AnalyticsPage />} />
        <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
        <Route path="/about"      element={<AboutPage />} />
        <Route path="*"           element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-text-secondary">
    <div className="text-6xl font-black text-cyber mb-4">404</div>
    <div className="text-sm tracking-widest mb-6">PAGE NOT FOUND</div>
    <a href="/" className="text-cyber hover:underline text-sm">← Return to home</a>
  </div>
);

const AppContent = () => {
  const [booted, setBooted] = useState(false);

  // Skip boot on hot-reload in dev (check sessionStorage)
  useEffect(() => {
    const skipped = sessionStorage.getItem('tg-booted');
    if (skipped) setBooted(true);
  }, []);

  const handleBootComplete = () => {
    setBooted(true);
    sessionStorage.setItem('tg-booted', '1');
  };

  return (
    <>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && (
        <AppShell>
          <AnimatedRoutes />
        </AppShell>
      )}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
