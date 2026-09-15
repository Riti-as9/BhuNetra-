import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Activity, ArrowRight,
  MapPin, Cpu, Radio, Zap, ChevronRight,
} from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';
import { BhuNetraBrand } from '../components/brand/BhuNetraBrand';
import { LiveDot } from '../components/ui/LiveDot';
import { getActiveAlerts } from '../data/alerts';
import { zoneStats } from '../data/zones';
import { systemStats } from '../data/analytics';
import { getRiskColor, formatTimeAgo } from '../utils/riskUtils';

// Lazy-load 3D globe â€” keeps initial bundle lean
const InteractiveGlobe = lazy(() =>
  import('../components/globe/InteractiveGlobe').then(m => ({ default: m.InteractiveGlobe }))
);

const GlobeFallback = () => (
  <div className="w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center rounded-full border border-cyber/20"
    style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, #0a0e14 70%)' }}>
    <div className="font-mono text-xs text-cyber animate-pulse tracking-widest">
      â–¶ LOADING 3D GLOBE...
    </div>
  </div>
);

// â”€â”€ Alert ticker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AlertTicker = () => {
  const alerts = getActiveAlerts();
  const items = [...alerts, ...alerts]; // duplicate for seamless loop

  return (
    <div className="relative overflow-hidden border-y border-base-border bg-base-panel/60"
      style={{ backdropFilter: 'blur(8px)' }}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10"
        style={{ background: 'linear-gradient(90deg, #0a0e14, transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10"
        style={{ background: 'linear-gradient(-90deg, #0a0e14, transparent)' }} />
      {/* Left label */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 border-r border-base-border bg-base-card">
        <span className="font-mono text-xxs tracking-widest text-critical flex items-center gap-1.5 whitespace-nowrap">
          <AlertTriangle size={11} />
          ACTIVE ALERTS
        </span>
      </div>

      <div className="pl-36 py-2.5 overflow-hidden whitespace-nowrap">
        <div className="ticker-scroll inline-flex items-center gap-8">
          {items.map((a, i) => (
            <span key={`${a.id}-${i}`}
              className="inline-flex items-center gap-2 font-mono text-xs">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRiskColor(a.severity), boxShadow: `0 0 6px ${getRiskColor(a.severity)}` }}
              />
              <span className="text-text-secondary">[{a.state}]</span>
              <span style={{ color: getRiskColor(a.severity) }}>{a.zoneName}</span>
              <span className="text-text-muted">â€”</span>
              <span className="text-text-secondary max-w-xs truncate">{a.message.slice(0, 80)}â€¦</span>
              <span className="text-text-muted">Â· {formatTimeAgo(a.timestamp)}</span>
              <span className="text-base-border mx-2">â—†</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// â”€â”€ Feature card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    className="relative p-5 rounded-xl border border-base-border bg-base-card group hover:border-opacity-60 transition-all"
    style={{ boxShadow: `0 0 20px ${color}08` }}
    whileHover={{ boxShadow: `0 0 30px ${color}18` }}
  >
    <div className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
      style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <h3 className="font-sans font-semibold text-text-primary mb-2 text-sm">{title}</h3>
    <p className="font-mono text-xxs text-text-secondary leading-relaxed">{desc}</p>
  </motion.div>
);

// â”€â”€ Stat strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HeroStat = ({ value, label, color }) => (
  <div className="text-center px-4">
    <div className="font-mono text-3xl font-bold" style={{ color }}>{value}</div>
    <div className="font-mono text-xxs text-text-muted tracking-widest mt-1 uppercase">{label}</div>
  </div>
);

// â”€â”€ NER States list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NER_STATES = [
  'Assam', 'Meghalaya', 'Sikkim', 'Arunachal Pradesh',
  'Nagaland', 'Manipur', 'Mizoram', 'Tripura',
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const activeAlerts = getActiveAlerts();
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="min-h-screen">

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative min-h-[92vh] flex flex-col">

        {/* Background radial glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]"
            style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96"
            style={{ background: 'radial-gradient(ellipse, rgba(255,77,77,0.05) 0%, transparent 65%)' }} />
        </div>

        {/* Alert ticker */}
        <AlertTicker />

        {/* Hero content â€” two-column on large screens */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 px-6 py-12 relative z-10 max-w-7xl mx-auto w-full">

          {/* â”€â”€ Left: text + CTAs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left min-w-0">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber/30 bg-cyber/5 font-mono text-xs text-cyber tracking-widest mb-8"
          >
            <Radio size={12} className="animate-pulse" />
            SIH 2026 Â· PS#26001 Â· MINISTRY OF DEVELOPMENT OF NER
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="mb-5">
              <BhuNetraBrand compact={false} showSubtitle={true} />
            </div>
            <h1 className="font-sans font-black text-4xl md:text-6xl leading-none tracking-tight text-text-primary mb-3">
              AI-POWERED
              <span className="text-text-secondary font-light ml-3">NER</span>
            </h1>
            <div className="font-mono text-sm md:text-base text-text-secondary tracking-[0.2em] mb-6">
              AI-BASED EARLY WARNING & LANDSLIDE RISK MONITORING
            </div>
            <p className="font-sans text-text-secondary max-w-xl text-base leading-relaxed mb-10">
              Real-time sensor fusion, AI-powered risk prediction, and instant early warning
              for India's landslide-prone North Eastern Region â€” protecting lives and
              infrastructure across 8 states.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-sans font-semibold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #00d4ff20, #00d4ff10)',
                border: '1px solid #00d4ff50',
                color: '#00d4ff',
                boxShadow: '0 0 24px rgba(0,212,255,0.15)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(0,212,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.15)'}
            >
              <Activity size={16} />
              Open Live Dashboard
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-lg font-sans font-semibold text-sm transition-all border border-critical/30 bg-critical/5 text-critical hover:bg-critical/10"
            >
              <AlertTriangle size={16} />
              {criticalCount} Critical Alerts
            </button>
          </motion.div>

          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10"
          >
            <LiveDot label="LIVE MONITORING" />
            <span className="font-mono text-xxs text-text-muted">|</span>
            <span className="font-mono text-xxs text-text-muted tracking-widest">
              {zoneStats.sensorsOnline}/{zoneStats.sensorsTotal} SENSORS ONLINE
            </span>
            <span className="font-mono text-xxs text-text-muted">|</span>
            <span className="font-mono text-xxs text-text-muted tracking-widest">
              {zoneStats.total} ZONES MONITORED
            </span>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center lg:justify-start gap-0 divide-x divide-base-border border border-base-border rounded-xl bg-base-panel/60 overflow-hidden"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <HeroStat value={systemStats.zonesMonitored} label="Zones" color="#00d4ff" />
            <HeroStat value={systemStats.statesCovered} label="States" color="#00d4ff" />
            <HeroStat value={`${systemStats.modelAccuracy_pct}%`} label="AI Accuracy" color="#00ff9d" />
            <HeroStat value={`${systemStats.averageLeadTime_hours}h`} label="Lead Time" color="#ffb020" />
            <HeroStat value={zoneStats.criticalZones} label="Critical" color="#ff4d4d" />
          </motion.div>
          </div>

          {/* â”€â”€ Right: 3D Globe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex-shrink-0 w-full lg:w-[480px] xl:w-[540px]"
          >
            {/* Globe section label */}
            <div className="text-center mb-2">
              <span className="font-mono text-xxs text-cyber tracking-[0.3em]">
                â—ˆ LIVE RISK GLOBE Â· NER REGION â—ˆ
              </span>
            </div>
            <Suspense fallback={<GlobeFallback />}>
              <InteractiveGlobe />
            </Suspense>
            <div className="text-center mt-2">
              <span className="font-mono text-xxs text-text-muted">
                hover zone â€¢ click â†’ detail â€¢ drag to rotate
              </span>
            </div>
          </motion.div>

        </div>{/* end hero two-column */}

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center pb-6 text-text-muted"
        >
          <ChevronRight size={16} className="rotate-90 opacity-50" />
        </motion.div>
      </section>

      {/* â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="font-mono text-xxs text-cyber tracking-[0.3em] mb-3">SYSTEM CAPABILITIES</div>
          <h2 className="font-sans font-bold text-2xl text-text-primary">Mission-Critical Features</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Cpu,          color: '#00d4ff', delay: 0,    title: 'AI Risk Prediction',   desc: 'LSTM neural network fuses rainfall, soil moisture, slope stability, and seismic data to output zone-level risk scores with 93% accuracy.' },
            { icon: Radio,        color: '#00ff9d', delay: 0.05, title: 'Real-Time Sensor Feed', desc: '22 field sensors (piezometers, rain gauges, inclinometers, seismographs) stream live data every 60 seconds across the NER.' },
            { icon: MapPin,       color: '#ffb020', delay: 0.1,  title: 'Interactive Risk Map',  desc: 'Color-coded Leaflet map of all monitored zones across 8 NER states with live tooltip overlays and zone drill-down.' },
            { icon: AlertTriangle,color: '#ff4d4d', delay: 0.15, title: 'Early Warning System',  desc: 'AI-generated alerts with severity classification, affected village lists, and recommended actions pushed to SDMA authorities.' },
            { icon: Activity,     color: '#a855f7', delay: 0.2,  title: 'Predictive Analytics',  desc: 'Historical trend charts, rainfall-risk correlation graphs, model confidence tracking, and seasonal incident analysis.' },
            { icon: Zap,          color: '#00d4ff', delay: 0.25, title: 'SDMA Integration',       desc: 'Direct notification channel to state disaster management authorities â€” ASDMA, MeSDMA, SDMA-SK, NSDMA, and 4 more.' },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* â”€â”€ NER COVERAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="px-6 py-12 border-t border-base-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="font-mono text-xxs text-cyber tracking-[0.3em] mb-2">COVERAGE AREA</div>
            <h2 className="font-sans font-bold text-xl text-text-primary">North Eastern Region â€” 8 States</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {NER_STATES.map((state, i) => (
              <motion.button
                key={state}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg font-mono text-xs text-text-secondary border border-base-border bg-base-card hover:border-cyber/40 hover:text-cyber transition-all"
              >
                <MapPin size={11} className="inline mr-1.5 opacity-60" />
                {state}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ BOTTOM CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="px-6 py-16 text-center border-t border-base-border">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="font-mono text-xxs text-critical tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-critical animate-pulse" />
            {criticalCount} CRITICAL ZONES REQUIRE IMMEDIATE ATTENTION
          </div>
          <h2 className="font-sans font-bold text-2xl text-text-primary mb-6">
            Access the Command Center
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-sans font-bold text-base text-[#0a0e14] transition-all"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #00b8e0)',
              boxShadow: '0 0 32px rgba(0,212,255,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 48px rgba(0,212,255,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(0,212,255,0.3)'}
          >
            <LayoutDashboardIcon />
            Launch Dashboard
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>
    </div>
  );
};

const LayoutDashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
    <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
  </svg>
);


