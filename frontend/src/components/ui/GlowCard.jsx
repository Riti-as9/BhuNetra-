import { motion } from 'framer-motion';
import { getRiskColor, getRiskBorder } from '../../utils/riskUtils';

export const GlowCard = ({
  children,
  className = '',
  riskLevel = null,
  onClick,
  active = false,
  animate = true,
}) => {
  const borderColor = riskLevel ? getRiskBorder(riskLevel) : active ? 'rgba(0,212,255,0.4)' : '#232b3a';
  const glowColor = riskLevel ? getRiskColor(riskLevel) : '#00d4ff';
  const glowOpacity = active ? 0.2 : riskLevel === 'critical' ? 0.15 : 0.08;

  return (
    <motion.div
      onClick={onClick}
      whileHover={animate ? { scale: 1.005 } : {}}
      className={`relative rounded-lg overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: '#161b22',
        border: `1px solid ${borderColor}`,
        boxShadow: active
          ? `0 0 0 1px ${glowColor}40, 0 0 24px ${glowColor}25`
          : `0 0 16px ${glowColor}${Math.round(glowOpacity * 255).toString(16).padStart(2,'0')}`,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Subtle top-edge glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${glowColor}40, transparent)` }} />
      {children}
    </motion.div>
  );
};
