import { motion, AnimatePresence } from 'framer-motion';
import { Radio, CloudRain, Layers, Activity, Zap, Droplets } from 'lucide-react';
import { getRiskColor } from '../../utils/riskUtils';

const SENSOR_ICONS = {
  raingauge:    CloudRain,
  soilmoisture: Layers,
  piezometer:   Droplets,
  inclinometer: Activity,
  seismograph:  Zap,
};

const SensorRow = ({ sensor }) => {
  const Icon = SENSOR_ICONS[sensor.type] || Radio;
  const isOnline = sensor.status === 'online';
  const reading = sensor.reading;
  const isAboveThreshold = reading.value != null && reading.value > reading.threshold;
  const valueColor = !isOnline ? '#4a5568'
    : isAboveThreshold ? '#ff4d4d'
    : reading.value > reading.threshold * 0.85 ? '#ffb020'
    : '#00ff9d';

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 px-3 py-2 rounded border border-base-border/50 bg-base-card/40 group hover:border-base-border transition-colors"
    >
      {/* Status dot */}
      <div className="flex-shrink-0 relative">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: isOnline ? '#00ff9d' : '#4a5568' }} />
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
        style={{ background: `${valueColor}15` }}>
        <Icon size={11} style={{ color: valueColor }} />
      </div>

      {/* Name + zone */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xxs text-text-secondary truncate">{sensor.id}</div>
        <div className="font-mono text-[9px] text-text-muted truncate">{sensor.name}</div>
      </div>

      {/* Reading */}
      <div className="flex-shrink-0 text-right">
        {isOnline && reading.value != null ? (
          <motion.div
            key={reading.value}
            initial={{ scale: 1.1, color: '#ffffff' }}
            animate={{ scale: 1, color: valueColor }}
            transition={{ duration: 0.4 }}
            className="font-mono text-xs font-semibold tabular-nums"
          >
            {typeof reading.value === 'number' ? reading.value.toFixed(1) : reading.value}
            <span className="text-[9px] text-text-muted ml-0.5">{reading.unit}</span>
          </motion.div>
        ) : (
          <span className="font-mono text-xxs text-text-muted">OFFLINE</span>
        )}
        {isOnline && reading.threshold && (
          <div className="font-mono text-[9px] text-text-muted">
            thr: {reading.threshold}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const SensorFeed = ({ sensors, tickCount }) => {
  // Show only online + recently-updated (top 12)
  const displayed = [...sensors]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'online' ? -1 : 1;
      // Above-threshold first
      const aAlert = a.reading.value != null && a.reading.value > a.reading.threshold;
      const bAlert = b.reading.value != null && b.reading.value > b.reading.threshold;
      return bAlert - aAlert;
    })
    .slice(0, 14);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <div className="font-sans font-semibold text-sm text-text-primary">Sensor Feed</div>
          <div className="font-mono text-xxs text-text-muted">
            {sensors.filter(s => s.status === 'online').length}/{sensors.length} online
          </div>
        </div>
        <motion.div
          key={tickCount}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono text-xxs text-cyber bg-cyber/10 border border-cyber/20 px-2 py-0.5 rounded"
        >
          TICK #{tickCount}
        </motion.div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence mode="popLayout">
          {displayed.map(s => (
            <SensorRow key={s.id} sensor={s} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
