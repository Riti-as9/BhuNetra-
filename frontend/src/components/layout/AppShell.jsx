import { motion } from 'framer-motion';
import { Navbar } from './Navbar';

// Grid overlay texture — subtle, as a CSS background pattern
const GridOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-0"
    style={{
      backgroundImage:
        'linear-gradient(rgba(35,43,58,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(35,43,58,0.18) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}
  />
);

// Faint scanline vignette
const ScanlineOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-0"
    style={{
      background:
        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)',
    }}
  />
);

// Corner accent — top-right and bottom-left glow
const CornerGlow = () => (
  <>
    <div
      className="pointer-events-none fixed top-0 right-0 w-96 h-96 z-0"
      style={{
        background:
          'radial-gradient(ellipse at top right, rgba(0,212,255,0.06) 0%, transparent 60%)',
      }}
    />
    <div
      className="pointer-events-none fixed bottom-0 left-0 w-80 h-80 z-0"
      style={{
        background:
          'radial-gradient(ellipse at bottom left, rgba(0,255,157,0.04) 0%, transparent 60%)',
      }}
    />
  </>
);

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const AppShell = ({ children }) => (
  <div
    className="min-h-screen relative"
    style={{ background: '#0a0e14', color: '#e2e8f0' }}
  >
    <GridOverlay />
    <ScanlineOverlay />
    <CornerGlow />

    {/* Navbar */}
    <div className="relative z-10">
      <Navbar />
    </div>

    {/* Page content */}
    <main className="relative z-10">
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </main>

    {/* Application status footer */}
    <footer className="relative z-10 border-t border-base-border px-4 lg:px-6 py-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
        <span className="font-mono text-[9px] sm:text-xxs text-text-muted tracking-widest">
          BHUNETRA NER v2.4.1 · SIH 2026 · PS#26001 · MDoNER
        </span>

        <span className="font-mono text-[9px] sm:text-xxs text-text-muted">
          © 2026 Team BhuNetra · Disaster Management System
        </span>
      </div>
    </footer>
  </div>
);
