import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Droplets, CloudRain, Activity } from 'lucide-react';
import { RiskBadge } from '../ui/RiskBadge';
import { getRiskColor, getRiskBorder, formatTimeAgo } from '../../utils/riskUtils';

const ZoneRow = ({ zone, isSelected, onClick }) => {
  const color  = getRiskColor(zone.riskLevel);
  const border = getRiskBorder(zone.riskLevel);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(zone.id)}
      className="cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: isSelected ? color : '#232b3a',
        background: isSelected ? `${color}08` : '#161b22',
        boxShadow: isSelected ? `0 0 16px ${color}20` : 'none',
      }}
      whileHover={{ borderColor: `${color}60`, background: `${color}05` }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
      )}

      <div className="px-3 py-2.5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="font-sans font-semibold text-xs text-text-primary truncate">{zone.name}</div>
            <div className="font-mono text-xxs text-text-muted mt-0.5">
              {zone.state} · <span className="text-text-secondary">{zone.id}</span>
            </div>
          </div>
          <RiskBadge level={zone.riskLevel} score={zone.riskScore} />
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3">
          <Metric icon={CloudRain} value={`${zone.rainfall_mm}mm`} color="#00d4ff" />
          <Metric icon={Droplets}  value={`${zone.soilMoisture_pct}%`} color="#00d4ff" />
          <Metric icon={Activity}  value={zone.slopeStabilityIndex.toFixed(2)} color={zone.slopeStabilityIndex < 0.4 ? '#ff4d4d' : '#ffb020'} />
          <span className="ml-auto font-mono text-xxs text-text-muted">
            {formatTimeAgo(zone.lastUpdated)}
          </span>
          <ChevronRight size={12} className="text-text-muted flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
};

const Metric = ({ icon: Icon, value, color }) => (
  <span className="flex items-center gap-1 font-mono text-xxs" style={{ color }}>
    <Icon size={9} />
    {value}
  </span>
);

export const ZoneListPanel = ({ zones, selectedZoneId, onZoneClick }) => {
  // Sort: critical first, then watch, then safe; within each by riskScore desc
  const sorted = [...zones].sort((a, b) => {
    const order = { critical: 0, watch: 1, safe: 2 };
    if (order[a.riskLevel] !== order[b.riskLevel]) return order[a.riskLevel] - order[b.riskLevel];
    return b.riskScore - a.riskScore;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3 flex-shrink-0">
        <div>
          <div className="font-sans font-semibold text-sm text-text-primary">Monitored Zones</div>
          <div className="font-mono text-xxs text-text-muted tracking-widest">
            {zones.filter(z => z.riskLevel === 'critical').length} critical ·{' '}
            {zones.filter(z => z.riskLevel === 'watch').length} watch ·{' '}
            {zones.filter(z => z.riskLevel === 'safe').length} safe
          </div>
        </div>
        <div className="font-mono text-xxs text-cyber bg-cyber/10 border border-cyber/20 px-2 py-0.5 rounded">
          {zones.length} total
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence mode="popLayout">
          {sorted.map(zone => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              isSelected={zone.id === selectedZoneId}
              onClick={onZoneClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
