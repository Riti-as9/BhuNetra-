import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import { FLOW_NODES, FLOW_EDGES } from '../../data/features';

const W = 840;   // SVG viewBox width
const H = 620;   // SVG viewBox height

// Node dimensions
const SENSOR_W = 100, SENSOR_H = 36;
const AI_W     = 120, AI_H     = 56;
const OUT_W    = 110, OUT_H    = 36;

// ── Get bounding rect center for an edge endpoint ────────────
const getNodeCenter = (id) => {
  const { sensors, ai, outputs } = FLOW_NODES;
  if (id === 'ai') return { x: ai.x, y: ai.y };
  const s = sensors.find(n => n.id === id);
  if (s) return { x: s.x + SENSOR_W / 2, y: s.y + SENSOR_H / 2 };
  const o = outputs.find(n => n.id === id);
  if (o) return { x: o.x, y: o.y + OUT_H / 2 };
  return { x: 0, y: 0 };
};

// ── Animated particle along a cubic bezier path ───────────────
const Particle = ({ edge, delay, duration, alertMode }) => {
  const from = getNodeCenter(edge.from);
  const to   = getNodeCenter(edge.to);

  // Bezier control points
  const cpX1 = from.x + (to.x - from.x) * 0.45;
  const cpX2 = from.x + (to.x - from.x) * 0.55;
  const pathD = `M${from.x},${from.y} C${cpX1},${from.y} ${cpX2},${to.y} ${to.x},${to.y}`;

  const color = alertMode ? '#ff4d4d' : edge.color;

  return (
    <motion.circle
      r={alertMode ? 4 : 2.5}
      fill={color}
      style={{ filter: `drop-shadow(0 0 ${alertMode ? 6 : 3}px ${color})` }}
      initial={{ offsetDistance: '0%', opacity: 0 }}
      animate={{ offsetDistance: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 0.4,
        ease: 'linear',
      }}
      // SVG motion path
      {...{
        style: {
          offsetPath: `path("${pathD}")`,
          offsetDistance: '0%',
          filter: `drop-shadow(0 0 ${alertMode ? 6 : 3}px ${color})`,
        }
      }}
    />
  );
};

// ── Edge (bezier connector line) ──────────────────────────────
const Edge = ({ edge, alertMode }) => {
  const from = getNodeCenter(edge.from);
  const to   = getNodeCenter(edge.to);
  const cpX1 = from.x + (to.x - from.x) * 0.45;
  const cpX2 = from.x + (to.x - from.x) * 0.55;
  const color = alertMode ? '#ff4d4d' : edge.color;

  return (
    <path
      d={`M${from.x},${from.y} C${cpX1},${from.y} ${cpX2},${to.y} ${to.x},${to.y}`}
      fill="none"
      stroke={color}
      strokeWidth={alertMode ? 1.2 : 0.8}
      strokeOpacity={0.25}
      strokeDasharray="4 4"
    />
  );
};

// ── Node boxes ────────────────────────────────────────────────
const SensorNode = ({ node, alertMode }) => (
  <g transform={`translate(${node.x},${node.y})`}>
    <rect
      x={0} y={0} width={SENSOR_W} height={SENSOR_H} rx={6}
      fill="#161b22"
      stroke={alertMode ? '#ff4d4d' : '#232b3a'}
      strokeWidth={0.8}
      style={{ filter: alertMode ? 'drop-shadow(0 0 5px #ff4d4d40)' : undefined }}
    />
    <text x={SENSOR_W / 2} y={14} textAnchor="middle" fill="#00d4ff" fontSize={8} fontFamily="JetBrains Mono">
      {node.label}
    </text>
    <text x={SENSOR_W / 2} y={26} textAnchor="middle" fill="#4a5568" fontSize={7} fontFamily="JetBrains Mono">
      {node.sub}
    </text>
    {/* Online dot */}
    <circle cx={SENSOR_W - 8} cy={8} r={3} fill="#00ff9d" opacity={0.8} />
  </g>
);

const OutputNode = ({ node, alertMode }) => (
  <g transform={`translate(${node.x},${node.y})`}>
    <rect
      x={0} y={0} width={OUT_W} height={OUT_H} rx={6}
      fill="#161b22"
      stroke={alertMode ? '#ff4d4d' : '#232b3a'}
      strokeWidth={0.8}
    />
    <text x={OUT_W / 2} y={14} textAnchor="middle" fill="#00ff9d" fontSize={8} fontFamily="JetBrains Mono">
      {node.label}
    </text>
    <text x={OUT_W / 2} y={26} textAnchor="middle" fill="#4a5568" fontSize={7} fontFamily="JetBrains Mono">
      {node.sub}
    </text>
  </g>
);

const AINode = ({ alertMode, pulseCount }) => {
  const { ai } = FLOW_NODES;
  const x = ai.x - AI_W / 2;
  const y = ai.y - AI_H / 2;
  return (
    <g>
      {/* Concentric pulse rings (appear on new alert) */}
      {[1, 2, 3].map(i => (
        <motion.circle
          key={`ring-${i}-${pulseCount}`}
          cx={ai.x} cy={ai.y}
          r={AI_W / 2}
          fill="none"
          stroke={alertMode ? '#ff4d4d' : '#00d4ff'}
          strokeWidth={1}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
          transition={{ duration: 1.4, delay: i * 0.3, ease: 'easeOut' }}
        />
      ))}
      {/* Main box */}
      <motion.rect
        x={x} y={y} width={AI_W} height={AI_H} rx={10}
        fill="#0d1117"
        stroke={alertMode ? '#ff4d4d' : '#00d4ff'}
        strokeWidth={1.5}
        animate={{
          filter: alertMode
            ? ['drop-shadow(0 0 8px #ff4d4d80)', 'drop-shadow(0 0 16px #ff4d4d)']
            : ['drop-shadow(0 0 6px #00d4ff40)', 'drop-shadow(0 0 12px #00d4ff80)'],
        }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
      />
      <text x={ai.x} y={ai.y - 8} textAnchor="middle" fill={alertMode ? '#ff4d4d' : '#00d4ff'} fontSize={10} fontWeight="bold" fontFamily="JetBrains Mono">
        AI ENGINE
      </text>
      <text x={ai.x} y={ai.y + 7} textAnchor="middle" fill="#8892a4" fontSize={8} fontFamily="JetBrains Mono">
        LSTM v3.1
      </text>
      <text x={ai.x} y={ai.y + 19} textAnchor="middle" fill="#4a5568" fontSize={7} fontFamily="JetBrains Mono">
        inference: 38ms
      </text>
    </g>
  );
};

// ── Cluster labels ────────────────────────────────────────────
const ClusterLabel = ({ x, y, label, color }) => (
  <text x={x} y={y} textAnchor="middle" fill={color} fontSize={7.5} fontFamily="JetBrains Mono" opacity={0.7}>
    {label}
  </text>
);

// ── Main component ────────────────────────────────────────────
export const DataFlowNetwork = ({ alertMode = false, pulseCount = 0 }) => {
  const { sensors, ai, outputs } = FLOW_NODES;

  // Stagger particle timing per edge
  const particleGroups = FLOW_EDGES.map((edge, i) => ({
    edge,
    particles: Array.from({ length: 3 }, (_, j) => ({
      delay: j * 0.9 + i * 0.15,
      duration: 1.6 + (i % 3) * 0.25,
    })),
  }));

  return (
    <div className="relative w-full rounded-xl border border-base-border overflow-hidden"
      style={{ background: '#070b10' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-border">
        <div className="font-mono text-xs text-cyber tracking-widest">DATA-FLOW NETWORK</div>
        <div className="flex items-center gap-2 font-mono text-xxs">
          <span className="text-text-muted">sensors → inference → response</span>
          {alertMode && (
            <motion.span
              className="text-critical"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              ● ALERT ACTIVE
            </motion.span>
          )}
        </div>
      </div>

      {/* SVG diagram */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="dfGrid" width={40} height={40} patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#232b3a" strokeWidth={0.4} opacity={0.4} />
          </pattern>
          {/* Glow filter for AI node */}
          <filter id="aiGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#dfGrid)" />

        {/* Cluster labels */}
        <ClusterLabel x={130} y={570} label="── SENSOR LAYER ──" color="#00d4ff" />
        <ClusterLabel x={420} y={570} label="── AI INFERENCE ──" color="#00d4ff" />
        <ClusterLabel x={710} y={570} label="── RESPONSE LAYER ──" color="#00ff9d" />

        {/* Cluster bracket lines */}
        <line x1={30}  y1={558} x2={230} y2={558} stroke="#232b3a" strokeWidth={0.8} />
        <line x1={310} y1={558} x2={530} y2={558} stroke="#232b3a" strokeWidth={0.8} />
        <line x1={610} y1={558} x2={820} y2={558} stroke="#232b3a" strokeWidth={0.8} />

        {/* Edges (static lines) */}
        {FLOW_EDGES.map((edge, i) => (
          <Edge key={i} edge={edge} alertMode={alertMode} />
        ))}

        {/* Animated particles */}
        {particleGroups.map(({ edge, particles }, i) =>
          particles.map((p, j) => (
            <Particle
              key={`${i}-${j}`}
              edge={edge}
              delay={p.delay}
              duration={p.duration}
              alertMode={alertMode}
            />
          ))
        )}

        {/* Sensor nodes */}
        {sensors.map(node => (
          <SensorNode key={node.id} node={node} alertMode={alertMode} />
        ))}

        {/* AI node */}
        <AINode alertMode={alertMode} pulseCount={pulseCount} />

        {/* Output nodes */}
        {outputs.map(node => (
          <OutputNode key={node.id} node={node} alertMode={alertMode} />
        ))}
      </svg>

      {/* Footer legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 border-t border-base-border font-mono text-xxs text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-critical/70 inline-block rounded" />
          Critical data
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-cyber/70 inline-block rounded" />
          Sensor telemetry
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-safe/70 inline-block rounded" />
          Authority notification
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyber/60 inline-block" />
          Particle = live data packet
        </div>
      </div>
    </div>
  );
};
