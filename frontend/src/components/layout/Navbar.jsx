import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Bell, BarChart2,
  Map, Info, Menu, X, Activity, BrainCircuit,
} from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useApp } from '../../context/AppContext';
import { getActiveAlerts } from '../../data/alerts';
import { BhuNetraBrand } from '../brand/BhuNetraBrand';

const NAV_ITEMS = [
  { path: '/',           label: 'HOME',      icon: Shield },
  { path: '/dashboard',  label: 'DASHBOARD', icon: LayoutDashboard },
  { path: '/alerts',     label: 'ALERTS',    icon: Bell },
  { path: '/analytics',  label: 'ANALYTICS', icon: BarChart2 },
  { path: '/risk-analysis', label: 'RISK AI', icon: BrainCircuit },
  { path: '/about',      label: 'ABOUT',     icon: Info },
];

const Clock = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }));
    };

    update();

    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-text-secondary tracking-widest">
      {time} <span className="text-text-muted">IST</span>
    </span>
  );
};

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeAlerts = getActiveAlerts();

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-base-border"
      style={{
        background: 'rgba(13,17,23,0.92)',
        backdropFilter: 'blur(12px)',
      }}
    >

      {/* Scan-line top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, #00d4ff60, #00ff9d40,transparent)',
        }}
      />

      <div className="flex items-center justify-between px-4 lg:px-6 h-14">

        {/* BhuNetra Brand */}
        <NavLink
          to="/"
          className="flex-shrink-0 group"
          aria-label="BhuNetra Home"
        >
          <BhuNetraBrand compact={false} />
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2 rounded font-mono text-xxs tracking-widest transition-colors ${
                  isActive
                    ? 'text-cyber bg-cyber/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-base-hover'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={13} />
                  {label}

                  {label === 'ALERTS' && activeAlerts.length > 0 && (
                    <span className="ml-0.5 px-1 py-0.5 text-xxs font-bold rounded bg-critical/20 text-critical border border-critical/30 leading-none">
                      {activeAlerts.length}
                    </span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-px"
                      style={{ background: '#00d4ff' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Clock />

          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-base-border bg-base-panel"
          >
            <div className="p-3 space-y-1">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs tracking-widest ${
                      isActive
                        ? 'text-cyber bg-cyber/10'
                        : 'text-text-secondary'
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}

              <div className="pt-2 pb-1 px-3">
                <ConnectionStatus />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
