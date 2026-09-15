import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BhuNetraBrand } from '../brand/BhuNetraBrand';

const BOOT_LINES = [
  { text: 'BHUNETRA NER v2.4.1 — INITIALIZING...', delay: 0, color: '#00d4ff' },
  { text: 'Loading NER terrain and landslide inventory...', delay: 400, color: '#8892a4' },
  { text: '  [OK] GSI inventory loaded: 9,300 historical features', delay: 900, color: '#00ff9d' },
  { text: 'Loading monitored NER zones...', delay: 1200, color: '#8892a4' },
  { text: '  [OK] 6 monitored zones / 8 NER states', delay: 1700, color: '#00ff9d' },
  { text: 'Initializing AI risk prediction engine...', delay: 2100, color: '#8892a4' },
  { text: '  [OK] XGBoost model loaded (11 risk features)', delay: 2600, color: '#00ff9d' },
  { text: '  [OK] Risk probability pipeline ready', delay: 3000, color: '#00ff9d' },
  { text: 'Starting live monitoring simulation...', delay: 3400, color: '#8892a4' },
  { text: '  [OK] Rainfall + soil-moisture streams active', delay: 3900, color: '#00ff9d' },
  { text: 'Running zone risk assessment...', delay: 4300, color: '#8892a4' },
  { text: '  [CRITICAL] North Sikkim Range — elevated risk detected', delay: 4700, color: '#ff4d4d' },
  { text: '  [HIGH] Dima Hasao Highland — elevated risk detected', delay: 5000, color: '#ffb020' },
  { text: '  [HIGH] Garo Hills West — elevated risk detected', delay: 5300, color: '#ffb020' },
  { text: 'Establishing WebSocket monitoring relay...', delay: 5600, color: '#8892a4' },
  { text: '  [OK] Live dashboard update channel ready', delay: 6000, color: '#00ff9d' },
  { text: 'All systems ready. Launching dashboard...', delay: 6400, color: '#00d4ff' },
];

const PROGRESS_STEPS = [
  { pct: 10, label: 'Loading inventory...' },
  { pct: 25, label: 'Loading NER zones...' },
  { pct: 42, label: 'Initializing XGBoost...' },
  { pct: 58, label: 'Starting monitoring...' },
  { pct: 74, label: 'Running risk assessment...' },
  { pct: 90, label: 'Connecting WebSocket...' },
  { pct: 100, label: 'Ready.' },
];

export const BootSequence = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Initializing...');
  const [done, setDone] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    const timers = [];

    BOOT_LINES.forEach((line) => {
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);

        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, line.delay));
    });

    PROGRESS_STEPS.forEach(({ pct, label }, i) => {
      timers.push(setTimeout(() => {
        setProgress(pct);
        setProgressLabel(label);
      }, 300 + i * 850));
    });

    timers.push(setTimeout(() => {
      setDone(true);
      setTimeout(() => onComplete?.(), 600);
    }, 7000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: '#0a0e14' }}
        >

          {/* Grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(35,43,58,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(35,43,58,0.25) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Top glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32"
            style={{
              background:
                'radial-gradient(ellipse at top, rgba(0,212,255,0.12) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 w-full max-w-2xl px-6">

            {/* BhuNetra Brand */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center mb-8"
            >
              <BhuNetraBrand compact={false} large={true} showSubtitle={true} />
            </motion.div>

            {/* Terminal log */}
            <div
              className="bg-base-card border border-base-border rounded-lg overflow-hidden mb-5"
              style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}
            >

              {/* Terminal title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base-border bg-base-panel">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-critical/60" />
                  <div className="w-3 h-3 rounded-full bg-watch/60" />
                  <div className="w-3 h-3 rounded-full bg-safe/60" />
                </div>

                <span className="font-mono text-xxs text-text-muted tracking-widest ml-2">
                  bhunetra-init — terminal
                </span>
              </div>

              {/* Log output */}
              <div
                ref={logRef}
                className="p-4 h-56 overflow-y-auto font-mono text-xs leading-6 space-y-0.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {visibleLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ color: line.color }}
                  >
                    <span className="text-text-muted mr-2 select-none">
                      $
                    </span>
                    {line.text}
                  </motion.div>
                ))}

                {/* Blinking cursor */}
                <span className="inline-block w-2 h-4 bg-cyber animate-blink align-middle" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xxs">
                <span className="text-text-secondary tracking-widest">
                  {progressLabel}
                </span>

                <span className="text-cyber">
                  {progress}%
                </span>
              </div>

              <div className="h-1.5 bg-base-panel rounded-full overflow-hidden border border-base-border">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #00d4ff, #00ff9d)',
                    boxShadow: '0 0 10px rgba(0,212,255,0.4)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Bottom branding */}
            <div className="flex items-center justify-between mt-6 font-mono text-xxs text-text-muted">
              <span className="tracking-widest">
                PS#26001 · MINISTRY OF DEVELOPMENT OF NER
              </span>

              <span className="tracking-widest">
                MDONER · GOI
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


