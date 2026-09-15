import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Zap } from 'lucide-react';
import { TERMINAL_SEQUENCES } from '../../data/features';

// Colorize specific keywords inline
const colorizeToken = (text) => {
  if (!text) return null;

  const rules = [
    { re: /\b(CRITICAL|IMMINENT|FAILURE|EXTREME|RECORD HIGH|ABOVE THRESHOLD|SATURATED|ESCALATING)\b/g, color: '#ff4d4d' },
    { re: /\b(WARN|WARNING|HIGH|ELEVATED|ABOVE SAFE LIMIT|⚠)\b/g, color: '#ffb020' },
    { re: /\b(OK|HEALTHY|nominal|ACTIVE|online)\b/gi, color: '#00ff9d' },
    { re: /\b(\d+\.?\d*\s*(mm|kPa|%|°\/day|M)\b)/g, color: '#00d4ff' },
    { re: /\b(LSTM|AI|MODEL|inference|confidence)\b/gi, color: '#a855f7' },
    { re: /ZN-[A-Z]+-\d+/g, color: '#00d4ff' },
    { re: /SNS-[A-Z]+-\d+/g, color: '#00d4ff' },
  ];

  // Split into colorized spans
  const segments = [];
  let remaining = text;
  let key = 0;

  // Simple single-pass: find earliest match, push plain text before it, push colored match
  while (remaining.length > 0) {
    let earliest = null;
    let matchColor = null;

    for (const { re, color } of rules) {
      re.lastIndex = 0;
      const m = re.exec(remaining);
      if (m && (!earliest || m.index < earliest.index)) {
        earliest = m;
        matchColor = color;
      }
    }

    if (!earliest) {
      segments.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (earliest.index > 0) {
      segments.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
    }
    segments.push(
      <span key={key++} style={{ color: matchColor, fontWeight: 600 }}>{earliest[0]}</span>
    );
    remaining = remaining.slice(earliest.index + earliest[0].length);
  }

  return segments;
};

// A single rendered terminal line
const TerminalLine = ({ line, isNew }) => {
  const [displayed, setDisplayed] = useState('');
  const [appendDisplayed, setAppendDisplayed] = useState('');
  const fullText = line.text || '';
  const appendText = line.append?.text || '';

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    if (!appendText) return;
    const delay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setAppendDisplayed(appendText.slice(0, i));
        if (i >= appendText.length) clearInterval(interval);
      }, 18);
      return () => clearInterval(interval);
    }, fullText.length * 18 + 100);
    return () => clearTimeout(delay);
  }, [appendText, fullText.length]);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -4 } : false}
      animate={{ opacity: 1, x: 0 }}
      className="font-mono text-xs leading-6 whitespace-pre-wrap break-all"
      style={{ color: line.color || '#8892a4' }}
    >
      {colorizeToken(displayed)}
      {appendText && appendDisplayed && (
        <span style={{ color: line.append?.color || '#00d4ff', fontWeight: 600 }}>
          {appendDisplayed}
        </span>
      )}
      {line.suffix && displayed === fullText && (
        <span style={{ color: '#8892a4' }}>{line.suffix}</span>
      )}
    </motion.div>
  );
};

export const AITerminalFeed = ({ onNewAlert }) => {
  const [lines, setLines]       = useState([]);
  const [seqIdx, setSeqIdx]     = useState(0);
  const [lineIdx, setLineIdx]   = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [blinkOn, setBlinkOn]   = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const logRef = useRef(null);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setBlinkOn(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  // Sequence runner
  const runSequence = useCallback((sIdx) => {
    const seq = TERMINAL_SEQUENCES[sIdx % TERMINAL_SEQUENCES.length];
    setIsRunning(true);

    // Add separator line before each new sequence (except first)
    if (sIdx > 0) {
      setLines(prev => [...prev.slice(-40), {
        text: '─'.repeat(52),
        color: '#232b3a',
        id: `sep-${Date.now()}`,
      }]);
    }

    seq.forEach((line, i) => {
      setTimeout(() => {
        setLines(prev => [...prev.slice(-50), { ...line, id: `${sIdx}-${i}-${Date.now()}`, isNew: true }]);
        setLineIdx(i);
        // Fire alert callback on critical lines
        if (line.color === '#ff4d4d' && onNewAlert) onNewAlert(line.text);
      }, line.delay + 200);
    });

    // When sequence ends, wait then start next
    const lastDelay = seq[seq.length - 1].delay + 2000;
    setTimeout(() => {
      setIsRunning(false);
      setCycleCount(c => c + 1);
    }, lastDelay);
  }, [onNewAlert]);

  // Kick off first sequence, then chain
  useEffect(() => {
    const timer = setTimeout(() => runSequence(0), 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (cycleCount === 0) return;
    // 15s pause between sequences (as per spec)
    const timer = setTimeout(() => {
      const next = cycleCount % TERMINAL_SEQUENCES.length;
      setSeqIdx(next);
      runSequence(cycleCount);
    }, 15000);
    return () => clearTimeout(timer);
  }, [cycleCount, runSequence]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: '#232b3a', background: '#0d1117' }}>
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-cyber" />
          <span className="font-mono text-xs text-text-secondary tracking-widest">AI INFERENCE LOG</span>
        </div>

        {/* AI MODEL: ACTIVE badge */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: isRunning ? [1, 1.08, 1] : 1, opacity: isRunning ? [1, 0.7, 1] : 1 }}
            transition={{ repeat: isRunning ? Infinity : 0, duration: 1.2 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-xxs"
            style={{
              color: '#00d4ff',
              borderColor: 'rgba(0,212,255,0.3)',
              background: 'rgba(0,212,255,0.08)',
            }}
          >
            <Zap size={9} />
            AI MODEL: {isRunning ? 'ACTIVE' : 'STANDBY'}
          </motion.div>
          {/* Pulsing dot */}
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              backgroundColor: isRunning ? '#00ff9d' : '#ffb020',
              boxShadow: `0 0 6px ${isRunning ? '#00ff9d' : '#ffb020'}`,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Terminal window chrome */}
      <div className="flex gap-1.5 px-3 py-1.5 border-b"
        style={{ borderColor: '#1a1f2a', background: '#0d1117' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-critical/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-watch/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-safe/50" />
        <span className="font-mono text-xxs text-text-muted ml-2 tracking-widest">bhunetra-ai — inference</span>
      </div>

      {/* Log output */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 space-y-px"
        style={{
          background: '#070b10',
          scrollbarWidth: 'thin',
          scrollbarColor: '#232b3a #070b10',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          // Subtle scanline
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(0,0,0,0.07) 23px, rgba(0,0,0,0.07) 24px)',
        }}
      >
        {/* Prompt prefix on first line */}
        {lines.length === 0 && (
          <div className="font-mono text-xs text-text-muted">
            Waiting for AI engine...
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {lines.map((line, i) => (
            <TerminalLine
              key={line.id}
              line={line}
              isNew={line.isNew && i === lines.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Blinking cursor on last line */}
        <span
          className="inline-block w-2 h-4 align-middle"
          style={{
            background: '#00ff9d',
            opacity: blinkOn ? 1 : 0,
            transition: 'opacity 0.1s',
            boxShadow: '0 0 6px #00ff9d',
          }}
        />
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t font-mono text-xxs text-text-muted"
        style={{ borderColor: '#232b3a', background: '#0d1117' }}>
        <span>cycles: <span className="text-cyber">{cycleCount}</span></span>
        <span>lines: <span className="text-cyber">{lines.filter(l => l.text && !l.text.startsWith('─')).length}</span></span>
        <span>
          status: <span style={{ color: isRunning ? '#00ff9d' : '#ffb020' }}>
            {isRunning ? 'INFERRING' : 'IDLE'}
          </span>
        </span>
      </div>
    </div>
  );
};
